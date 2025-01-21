import logging
from itertools import chain
from django.http import HttpResponse, JsonResponse
from rest_framework import status
import requests  # Used to make requests to SFU Course API
from rest_framework_simplejwt.tokens import RefreshToken

from .models import *

from .serializers import CourseSerializer, UserSerializer, LectureSectionSerializer
import io
from .utils import *
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

# Create your views here.
CURRENT_SEMESTER = get_current_term_code()  # TODO: depreciate this variable since it is not used
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
            return Response({"error": "Course could not be removed from your schedule"},
                            status=status.HTTP_404_NOT_FOUND)


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

    # Given a set of course IDs, retrieve the course info associated with each section as a list
    def post(self, request):
        course_ids = request.data["course_ids"]

        courses = Course.objects.filter(id__in=course_ids).values()

        lecture_sections_no_lab = LectureSection.objects.filter(course_id__in=course_ids).values()

        titles = [course['title'] for course in courses]
        section_codes = [course['section_name'] for course in courses]
        course_numbers = [course['course_number'] for course in courses]

        non_lecture_components = NonLectureSection.objects.filter(number__in=course_numbers
                                                                  , title__in=titles
                                                                  , section_code__in=section_codes).values()

        non_lecture_professors = [component['professor'] for component in non_lecture_components]
        non_lecture_titles = [component['title'] for component in non_lecture_components]
        non_lecture_numbers = [component['number'] for component in non_lecture_components]

        lecture_sections_with_lab = LectureSection.objects.filter(professor__in=non_lecture_professors
                                                                  , number__in=non_lecture_numbers
                                                                  , title__in=non_lecture_titles).values()

        lecture_sections = list(
            {tuple(section.items()) for section in chain(lecture_sections_no_lab, lecture_sections_with_lab)})

        lecture_sections = [dict(section) for section in lecture_sections]

        if not courses:
            return Response({"error": "Courses could not be retrieved"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"lecture_sections": list(lecture_sections)
                        , "non_lecture_sections": list(non_lecture_components)}
                        , status=status.HTTP_200_OK)


# Returns all courses to scheduleBuilder.js in the frontend via url
def fetch_all_courses(request):
    courses = Course.objects.all().values()
    return JsonResponse(list(courses), safe=False)


    #lecture_sections = Course.objects.all().values()
    #return JsonResponse(list(lecture_sections), safe=False)


    #lectures = Course.objects.filter(
    #    class_type__in=[Course.Component.LECTURE, Course.Component.SEMINAR]
    #)
    #return JsonResponse(list(lectures), safe=False)


class GetAvailableLecturesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        # Filter LectureSection objects where class_type is either LECTURE or SEMINAR.
        lectures = Course.objects.filter(
            class_type__in=[Course.Component.LECTURE, Course.Component.SEMINAR]
        )
        return JsonResponse(list(lectures), safe=False)


# Get the user's list of courses
class GetUserCoursesView(APIView):
    permission_classes = (IsAuthenticated,)
    def get(self, request):
        username = request.query_params.get('username')
        try:
            user = User.objects.get(username=username)
            courses = user.Courses.all()
            serializer = CourseSerializer(courses, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User: " + username + " not found"}, status=status.HTTP_404_NOT_FOUND)


class GetLectureSectionsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
            lecture_sections = course.lecturesection_set.all()  # Fetch related lecture sections
            data = [{"id": ls.id, "section_code": ls.section_code, "start_time": ls.start_time, "end_time": ls.end_time}
                    for ls in lecture_sections]
            return JsonResponse(data, safe=False)
        except Course.DoesNotExist:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)


class GetNonLectureSectionsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, lecture_section_id):
        try:
            lecture_section = LectureSection.objects.get(id=lecture_section_id)
            non_lecture_sections = lecture_section.non_lecture_sections.all()  # Use the new related_name
            data = [
                {"id": nls.id, "section_code": nls.section_code, "start_time": nls.start_time, "end_time": nls.end_time}
                for nls in non_lecture_sections]
            return JsonResponse(data, safe=False)
        except LectureSection.DoesNotExist:
            return Response({"error": "Lecture section not found"}, status=status.HTTP_404_NOT_FOUND)
