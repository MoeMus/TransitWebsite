import logging

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods, require_GET
from rest_framework import status
from rest_framework.exceptions import ParseError
import requests  # Used to make requests to SFU Course API
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Course
from .serializers import CourseSerializer, UserSerializer
import io
from .utils import *
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

# Create your views here.
CURRENT_SEMESTER = get_current_term_code() # TODO: depreciate this variable since it is not used
CURRENT_YEAR = get_current_year()
CURRENT_TERM_CODE = get_current_term_code()
CURRENT_TERM = get_current_term()

# Logging/debugging for Python, using when returning response errors
logger = logging.getLogger(__name__)


class UserView(APIView):
    permission_classes = (IsAuthenticated,)

    # Retrieve user info if logged in
    def get(self, request):
        username = request.query_params.get('username')

        try:
            current_user = User.objects.get(username=username)
            serializer = UserSerializer(current_user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User: " + username + " not found"}, status=status.HTTP_404_NOT_FOUND)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            logger.error(f"Logout failed: {str(e)}")
            return Response({"error": "Logout failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterView(APIView):

    def post(self, request):
        if User.objects.filter(username=request.data["username"]).exists():
            return Response({"error": "This username is already taken"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "There was an issue processing your request"}, status=status.HTTP_400_BAD_REQUEST)


def test_view(request):
    return HttpResponse('Test view')


class DeleteUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            user = User.objects.get(username=request.data["username"])
            user.delete()
            return Response(status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "Account not found"}, status=status.HTTP_404_NOT_FOUND)


class DeleteAllCoursesView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request):

        try:
            user = User.objects.get(username=request.data["username"])
            user.courses.all().delete()
            user.save()
            return Response(status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(self, status=status.HTTP_404_NOT_FOUND)


class AddCourseView(APIView):
    permission_classes = (IsAuthenticated,)

    # Expects the request body to be a JSON representation of a course as defined in the models.py
    # Front-end must create this format
    def post(self, request):
        username = request.data['username']
        course_name = request.data["courseName"]
        section_name = request.data["sectionName"]

        # Check if the course doesn't exist in the database
        if not Course.objects.filter(title=course_name, section_name=section_name).exists():
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get the course object
        new_course = Course.objects.filter(title=course_name, section_name=section_name).first()

        # Get the user's courses by username
        if not User.objects.filter(username=username).exists():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(username=username)
        existing_courses = user.Courses.all()

        # Check for time conflicts using the helper function
        conflicts = check_time_conflicts(new_course, existing_courses)

        if conflicts:
            # If conflicts are found, return them in the response
            return Response({
                "error": "Time conflicts detected",
                "conflicts": conflicts
            }, status=status.HTTP_409_CONFLICT)

        # If no conflicts, add the course to the user's schedule
        user.Courses.add(new_course)
        user.save()

        return Response({"success": "Course added successfully"}, status=status.HTTP_200_OK)


class DeleteCourseView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        username = request.data['username']
        course_name = request.data['course_name']
        section_name = request.data['section_name']
        if not username or not course_name:
            return Response({"error": "Username or course name was not given"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists() and Course.objects.filter(title=course_name).exists():
            user = User.objects.get(username=username)
            course = Course.objects.get(title=course_name, section_name=section_name)
            user.Courses.remove(course)
            user.save()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response({"error": "Course could not be removed from your schedule"}, status=status.HTTP_404_NOT_FOUND)


class GetCourseView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        department = request.query_params.get("department")
        number = request.query_params.get("courseNumber")

        if not department:
            return JsonResponse({"error": "The department is required"}, status=400)

        # Check if the course exists in our database of all courses
        course = Course.objects.filter(department=department, course_number=number, term=CURRENT_TERM_CODE).first()
        if course:
            # If the course exists, return it
            return Response(CourseSerializer(course).data, status=status.HTTP_200_OK)

        # Else, if the course is not found, fetch it from the Course Outline API:
        try:
            api_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{CURRENT_YEAR}/{CURRENT_TERM_CODE}/{department}"
            if number:
                api_url += f"/{number}"

            response = requests.get(api_url)
            response.raise_for_status()

            course_data = response.json()
            self.save_course_data(course_data)

            return JsonResponse(course_data, safe=False)

        except requests.exceptions.RequestException as e:
            logger.error(f"Course data fetch failed: {str(e)}")
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

    # Save a course's information into the database
    def save_course_data(self, course_data):
        Course.objects.update_or_create(
            name=course_data.get("name"),
            defaults={
                "department": course_data.get("dept"),
                "course_number": course_data.get("number"),
                "section_name": course_data.get("section"),
                "title": course_data.get("title"),
                "description": course_data.get("description"),
                "term": course_data.get("term"),
                "units": course_data.get("units"),
                "delivery_method": course_data.get("deliveryMethod"),
            },
        )


# Returns all courses to scheduleBuilder.js in the frontend via url
def fetch_all_courses(request):
    courses = Course.objects.all().values()
    return JsonResponse(list(courses), safe=False)


