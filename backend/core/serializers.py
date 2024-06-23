from rest_framework import serializers
from .models import User, Course


class UserSerializer(serializers.ModelSerializer):


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["name", "department", "course_number", "professor", "semester", "component"]
