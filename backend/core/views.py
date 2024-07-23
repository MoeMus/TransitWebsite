from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
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

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({"user": serializer.data}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):

        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):

    def post(self, request):

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)


def test_view(request):
    return HttpResponse('Test view')


class DeleteUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request):
        if User.objects.filter(username=request.data["username"]).exists():
            user = User.objects.get(username=request.data["username"])
            user.delete()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


class DeleteAllCoursesView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request):

        if User.objects.filter(username=request.data["username"]).exists():
            user = User.objects.get(username=request.data["username"])
            user.courses.all().delete()
            user.save()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(self, status=status.HTTP_404_NOT_FOUND)


class AddCourseView(APIView):
    permission_classes = (IsAuthenticated,)

    # Expects the request body to be a JSON representation of a course as defined in the models.py
    # Front-end must create this format
    def post(self, request):


        username = request.data['username']

        #If the course doesn't already exist in the database
        if not Course.objects.filter(name=request.data["courseName"], section_name=request.data["sectionName"]).exists():

            stream = io.BytesIO(request.body)
            try:
                data = JSONParser().parse(stream)
                serialized = CourseSerializer(data=data)
                if serialized.is_valid():
                    serialized.save()
                else:
                    raise ParseError
            except ParseError:
                return Response(status=status.HTTP_400_BAD_REQUEST)

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

    # Expected request body is a JSON format consisting of {department: <value>, courseNumber: <value>}, attributes
    # can be omitted
    def get(self, request):
        department = request.GET.get("department", "")
        number = request.GET.get("courseNumber", "")

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

