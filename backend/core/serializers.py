from rest_framework import serializers
from .models import User, Course


# extra_kwargs is for extra keyword arguments on 'password' to make it 128 characters
# https://www.django-rest-framework.org/api-guide/serializers/#additional-keyword-arguments
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'Courses']
        # Password length is set to 128 characters per OWASP
        # https://owasp.deteact.com/cheat/cheatsheets/Authentication_Cheat_Sheet.html#password-length
        extra_kwargs = {
            'password': {'write_only': True, 'max_length': 128},
            'username': {'max_length': 50}
        }

    def create(self, validated_data):
        user = User.objects.create_user(email=validated_data['email'], username=validated_data['username']
                                        , password=validated_data['password'])
        user.save()
        return user


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["title", "department", "course_number", "section_name", "description", "term", "delivery_method"]

    def create(self, validated_data):
        course = Course.objects.create(**validated_data)
        return course
