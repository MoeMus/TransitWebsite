from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST, require_http_methods, require_GET
from rest_framework.exceptions import ParseError
import requests
from .models import User, Course
from .serializers import CourseSerializer, UserSerializer
import io
from .utils import *
from rest_framework.parsers import JSONParser

# Create your views here.
CURRENT_SEMESTER = get_current_semester_code()
CURRENT_YEAR = get_current_year()
CURRENT_TERM = get_current_semester_code()


@require_POST()
def create_new_user(request):
    stream = io.BytesIO(request.body)
    try:
        data = JSONParser().parse(stream)
        serialized = UserSerializer(data=data)
        if serialized.is_valid():
            serialized.save()
        else:
            raise ParseError
    except ParseError:
        return HttpResponse(status=400)


def test_view(request):
    return HttpResponse('Test view')


@require_http_methods(['DELETE'])
def delete_user(pk, request):
    if User.objects.filter(id=pk).exists():
        user = User.objects.get(pk=pk)
        user.delete()
        return HttpResponse(status=200)
    else:
        return HttpResponse(status=404)


@require_http_methods(['DELETE'])
def delete_all_courses(request, pk):
    if User.objects.filter(id=pk).exists():
        user = User.objects.get(pk=pk)
        user.courses.all().delete()
        return HttpResponse(status=200)
    else:
        return HttpResponse(status=404)


#Expects the request body to be a JSON representation of a course as defined in the models.py
#Front-end must create this format
@require_POST()
def add_course_to_user(request, pk1):
    course = None
    course_id = request.GET.get('pk')

    #If the course doesn't already exist in the database
    if not Course.objects.filter(id=course_id).exists():
        stream = io.BytesIO(request.body)
        try:
            data = JSONParser().parse(stream)
            serialized = CourseSerializer(data=data)
            if serialized.is_valid():
                serialized.save()
            else:
                raise ParseError
        except ParseError:
            return HttpResponse(status=400)

    course = Course.objects.get(pk=course_id)

    if User.objects.filter(id=pk1).exists():
        user = User.objects.get(pk=pk1)
        user.courses.add(course)
        return HttpResponse(status=200)
    else:
        return HttpResponse(status=400)


@require_http_methods(['DELETE'])
def remove_course(request, pk1, pk2):
    if User.objects.filter(id=pk1).exists() and Course.objects.filter(id=pk2).exists():
        user = User.objects.get(pk=pk1)
        course = Course.objects.get(pk=pk2)
        user.courses.remove(course)
        return HttpResponse(status=200)
    else:
        return HttpResponse(status=404)


#Expected request body is a JSON format consisting of {department: <value>, number: <value>}, attributes can be omitted
@require_GET()
def get_all_courses_with_key_word(request):
    department = request.GET.get("department", "")
    number = request.GET.get("number", "")

    if not department:
        return

    if not number:

        try:
            matchingCourse = requests.get(
                "/bin/wcm/course-outlines?" + CURRENT_YEAR + "/" + CURRENT_TERM + "/" + department)
            matchingCourse.raise_for_status()
        except HttpResponse(status=404):
            return HttpResponse(status=404)

    else:

        try:
            matchingCourse = requests.get(
                "/bin/wcm/course-outlines?" + CURRENT_YEAR + "/" + CURRENT_TERM + "/" + department + "/" + number)
            matchingCourse.raise_for_status()
        except HttpResponse(status=404):
            return HttpResponse(status=404)

    return JsonResponse(matchingCourse.json())
