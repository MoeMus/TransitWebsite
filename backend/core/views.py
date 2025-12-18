import logging
from itertools import chain
from django.http import HttpResponse, JsonResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
import json
from django.db import IntegrityError, transaction

from .models import *

from .serializers import CourseSerializer, UserSerializer
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

    # Retrieve user info if logged in
    @permission_classes([IsAuthenticated])
    def get(self, request):

        username = request.query_params.get('username')

        try:
            current_user = User.objects.get(username=username)
            serializer = UserSerializer(current_user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User: " + username + " not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):

        try:

            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            else:
                return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        except IntegrityError:

            return Response({"error": "User with that username or email already exists"},
                            status=status.HTTP_400_BAD_REQUEST)

    @permission_classes([IsAuthenticated])
    def delete(self, request):

        username = request.query_params.get('username', None)
        try:
            user = User.objects.get(username=username)
            user.delete()
            return Response(status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "Account not found"}, status=status.HTTP_404_NOT_FOUND)

    @permission_classes([IsAuthenticated])
    def put(self, request):

        try:

            with transaction.atomic():

                user = User.objects.get(username=request.data['username'])

                if user.DoesNotExist:

                    return Response({"error": "Account not found"}, status=status.HTTP_404_NOT_FOUND)

                serializer = UserSerializer(user, data=request.data)

                if serializer.is_valid():

                    serializer.save()

        except IntegrityError:

            return Response({"error": "User with that username or email already exists"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data["refresh_token"]
        refresh_token = RefreshToken(refresh_token)
        refresh_token.blacklist()

        response = Response(status=status.HTTP_205_RESET_CONTENT)

        if 'user_session' in request.COOKIES:
            response.delete_cookie('user_session')

        return response

    except Exception as e:
        return Response({"error": "Logout failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def test_view(request):
    return HttpResponse('Test view')


class UserCourseView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        department = request.query_params.get("department")
        number = request.query_params.get("course_number")

        try:

            # Check if the course exists in our database of all courses
            course = get_object_or_404(Course, title=department, number=number)

            return Response(CourseSerializer(course).data, status=status.HTTP_200_OK)

        except Http404 as e:

            return Response({"error": "Course does not exist"}, status=status.HTTP_404_NOT_FOUND)

    # Adds a course to a user's schedule
    # Expects the request body to be a JSON representation of a course as defined in the models.py
    # Front-end must create this format
    def post(self, request):
        username = request.data['username']
        course_name = request.data["course_name"]
        section_name = request.data["section_name"]

        try:

            # Get the course object
            new_course = get_object_or_404(Course, title=course_name, section_name=section_name)

            # Get the user's courses by username

            user = get_object_or_404(User, username=username)
            existing_courses = user.courses.all()

            # Check for time conflicts using the helper function
            conflicts = check_time_conflicts(new_course, existing_courses)

            if conflicts:
                # If conflicts are found, return them in the response
                return Response({
                    "error": "Time conflicts detected",
                    "conflicts": conflicts
                }, status=status.HTTP_409_CONFLICT)

            # If no conflicts, add the course to the user's schedule
            user.courses.add(new_course)
            user.save()

            return Response({"success": "Course added successfully"}, status=status.HTTP_200_OK)

        except Http404 as e:

            return Response({"error": "No course or user found"}, status=status.HTTP_404_NOT_FOUND)

    # Removes a course from a user's schedule
    def delete(self, request):
        username = request.data['username']
        course_name = request.data['course_name']
        section_name = request.data['section_name']

        if not username or not course_name:
            return Response({"error": "Username or course name was not given"}, status=status.HTTP_400_BAD_REQUEST)

        try:

            with transaction.atomic():

                user = get_object_or_404(User, username=username)
                course = get_object_or_404(Course, title=course_name, section_name=section_name)

                user.courses.remove(course)
                user.save()

        except Http404 as e:

            return Response({"error": "course could not be removed from your schedule"},
                            status=status.HTTP_404_NOT_FOUND)


# Given a set of course IDs, retrieve the course info associated with each section as a list
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_courses_from_ids(request):
    course_id_params = request.query_params.get('course_ids', '')

    if course_id_params:

        course_ids = [course_id for course_id in course_id_params.split(',')]

    else:

        course_ids = []

    courses = Course.objects.filter(id__in=course_ids).values()
    if not courses:
        return Response({"error": "Courses could not be retrieved"}, status=status.HTTP_400_BAD_REQUEST)

    lecture_sections_no_lab = LectureSection.objects.filter(course_id__in=course_ids).values()

    titles = [course['title'] for course in courses]
    section_codes = [course['section_name'] for course in courses]
    course_numbers = [course['course_number'] for course in courses]

    non_lecture_components = NonLectureSection.objects.filter(number__in=course_numbers,
                                                              title__in=titles,
                                                              section_code__in=section_codes).values()

    non_lecture_professors = [component['professor'] for component in non_lecture_components]
    non_lecture_titles = [component['title'] for component in non_lecture_components]
    non_lecture_numbers = [component['number'] for component in non_lecture_components]

    lecture_sections_with_lab = LectureSection.objects.filter(professor__in=non_lecture_professors,
                                                              number__in=non_lecture_numbers,
                                                              title__in=non_lecture_titles).values()

    lecture_sections = list(
        {tuple(section.items()) for section in chain(lecture_sections_no_lab, lecture_sections_with_lab)})

    lecture_sections = [dict(section) for section in lecture_sections]

    return Response({"lecture_sections": list(lecture_sections),
                     "non_lecture_sections": list(non_lecture_components)},
                    status=status.HTTP_200_OK)


class UserAllCoursesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):

        username = request.query_params.get('username')

        try:

            user = get_object_or_404(User, username=username)
            courses = user.courses.all()

            return Response(CourseSerializer(courses, many=True).data, status=status.HTTP_200_OK)

        except Http404 as e:

            return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request):

        try:

            with transaction.atomic():
                user = User.objects.get(username=request.POST.data["username"])
                user.courses.all().delete()
                user.save()
                return Response(status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_all_courses(request):
    courses = Course.objects.all().values()
    return JsonResponse(list(courses), safe=False, status=status.HTTP_200_OK)


# Get the user's list of courses
# class GetUserCoursesView(APIView):
#     permission_classes = (IsAuthenticated,)
#
#     def get(self, request):
#         username = request.query_params.get('username')
#         try:
#             user = User.objects.get(username=username)
#             courses = user.courses.all()
#             serializer = CourseSerializer(courses, many=True)
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except User.DoesNotExist:
#             return Response({"error": "User: " + username + " not found"}, status=status.HTTP_404_NOT_FOUND)


class GetLectureSectionsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, course_id):

        course = Course.objects.get(id=course_id)

        if course.DoesNotExist:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

        lecture_sections = course.lecturesection_set.all()  # Fetch related lecture sections
        data = [{"id": ls.id, "section_code": ls.section_code, "start_time": ls.start_time, "end_time": ls.end_time}
                for ls in lecture_sections]

        return JsonResponse(data, safe=False)


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


# Retrieve the status of the cookie (It's available or it isn't)
class ApproveCookieView(APIView):

    def get(self, request):
        if 'user_session' in request.COOKIES:
            return Response({"status: Cookie found"}, status=status.HTTP_200_OK)

        return Response({"error: Cookie not found"}, status=status.HTTP_404_NOT_FOUND)


# Create a new cookie

class SetCookieView(APIView):

    def post(self, request):
        # cookie_info = {
        #     'access_token': request.data['access_token'],
        #     'refresh_token': request.data['refresh_token'],
        #     'username': request.data['username'],
        #     'Courses': request.data['Courses']
        # }
        user_data = json.loads(request.body)

        print(f"Data being put in the cookie: {json.dumps(request.data)}")
        response = Response({"status: Cookie successfully created"}, status=status.HTTP_201_CREATED)
        response.set_cookie(
            key='user_session',
            value=json.dumps(request.data),
            httponly=True,
            secure=True,  # Set to True if using HTTPS
            samesite='None',  # or 'None' if using HTTPS
            max_age=3600 * 24,
            path='/'
        )
        # print(response.cookies.get('user_session'))
        return response


# Retrieve user info from cookie
class CookieGetUserInfoView(APIView):

    def get(self, request):
        print(request.COOKIES)
        user_cookie = request.COOKIES.get('user_session')

        if user_cookie is None:
            return Response({'error': 'Cookie not found'}, status=status.HTTP_404_NOT_FOUND)

        user_info = json.loads(user_cookie)
        if user_info['access_token'] == "" or user_info['refresh_token'] == "" or user_info['username'] == "":
            return Response({'error': 'Cookie not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(user_info, status=status.HTTP_200_OK)


class DeleteCookieView(APIView):

    def get(self, request):
        response = Response({"status": 'Cookie not found'}, status=status.HTTP_200_OK)

        if 'user_session' in request.COOKIES:
            response = Response({'status': "Cookie deleted"}, status=status.HTTP_200_OK)
            response.delete_cookie('user_session')

        return response
