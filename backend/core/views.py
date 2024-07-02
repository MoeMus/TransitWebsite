from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST, require_http_methods
from rest_framework.exceptions import ParseError

from .models import User, Course
from .serializers import CourseSerializer, UserSerializer
import io

from rest_framework.parsers import JSONParser


# Create your views here.

@require_POST()
def create_new_user(json_content, request):
    stream = io.BytesIO(json_content)
    data = JSONParser().parse(stream)

    serialized = UserSerializer(data=data)
    if serialized.is_valid():
        serialized.save()
    else:
        raise ParseError


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


@require_POST()
def add_course(request, pk1, pk2):
    if User.objects.filter(id=pk1).exists() and Course.objects.filter(id=pk2).exists():
        user = User.objects.get(pk=pk1)
        course = Course.objects.get(pk=pk2)
        user.courses.add(course)
        return HttpResponse(status=200)
    else:
        return HttpResponse(status=404)


@require_http_methods(['DELETE'])
def remove_course(request, pk1, pk2):
    if User.objects.filter(id=pk1).exists() and Course.objects.filter(id=pk2).exists():
        user = User.objects.get(pk=pk1)
        course = Course.objects.get(pk=pk2)
        user.courses.remove(course)
        return HttpResponse(status=200)
    else:
        return HttpResponse(status=404)
