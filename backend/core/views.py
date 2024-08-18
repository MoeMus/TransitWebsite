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
CURRENT_SEMESTER = get_current_semester_code()
CURRENT_YEAR = get_current_year()
CURRENT_TERM = get_current_semester_code()


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
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

    def delete(self, request):
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

        #If the course doesn't already exist in the database
        if not Course.objects.filter(name=request.data["courseName"],
                                     section_name=request.data["sectionName"]).exists():

            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

        courses = Course.objects.filter(name=request.data["courseName"], section_name=request.data["sectionName"])

        course = courses.first()

        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            user.courses.add(course)
            user.save()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class DeleteCourseView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request):
        username = request.data['username']
        courseName = request.data['courseName']
        if User.objects.filter(username=username).exists() and Course.objects.filter(name=courseName).exists():
            user = User.objects.get(username=username)
            course = Course.objects.get(name=courseName)
            user.courses.remove(course)
            user.save()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


class GetCourseView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        department = request.query_params.get("department")
        number = request.query_params.get("courseNumber")

        if not department:
            return HttpResponse("The department is required", status=400)

        try:
            if not number:
                api_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{CURRENT_YEAR}/{CURRENT_TERM}/{department}"
            else:
                api_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{CURRENT_YEAR}/{CURRENT_TERM}/{department}/{number}"

            matching_course = requests.get(api_url)

            matching_course.raise_for_status()

            return JsonResponse(matching_course.json(), safe=False)

        except requests.exceptions.RequestException:

            return Response(status=status.HTTP_404_NOT_FOUND)
