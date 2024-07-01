from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST, require_http_methods
from rest_framework.exceptions import ParseError

from .models import User
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
    user = User.objects.get(pk=pk)
    try:
        user.delete()
        return HttpResponse(status=204)
    except user.DoesNotExist:
        return HttpResponse(status=404)
