from rest_framework import serializers
from .models import User, Course, LectureSection, NonLectureSection, NewSemesterNotification
from django.db.models import Q


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["title", "department", "course_number"]

    def create(self, validated_data):
        course = Course.objects.create(**validated_data)
        return course


class LectureSectionSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = LectureSection
        fields = '__all__'


class NonLectureSectionSerializer(serializers.ModelSerializer):
    lecture_section = LectureSectionSerializer(read_only=True)

    class Meta:
        model = NonLectureSection
        fields = '__all__'


# extra_kwargs is for extra keyword arguments on 'password' to make it 128 characters
# https://www.django-rest-framework.org/api-guide/serializers/#additional-keyword-arguments
class UserSerializer(serializers.ModelSerializer):
    lecture_sections = LectureSectionSerializer(many=True, read_only=True)
    non_lecture_sections = NonLectureSectionSerializer(many=True, read_only=True)
    username = serializers.CharField(validators=[])
    email = serializers.EmailField(validators=[])

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'lecture_sections', 'non_lecture_sections']
        # Password length is set to 128 characters per OWASP
        # https://owasp.deteact.com/cheat/cheatsheets/Authentication_Cheat_Sheet.html#password-length
        extra_kwargs = {
            'password': {'write_only': True, 'max_length': 128},
            'username': {'max_length': 50}
        }

    def validate(self, data):

        existing_user = User.objects.filter(
            Q(email=data['email']) | Q(username=data['username'])
        )

        if existing_user.exists():
            raise serializers.ValidationError({"error": "An account with that username or email already exists"})

        return data

    def create(self, validated_data):
        user = User.objects.create_user(email=validated_data['email'], username=validated_data['username'],
                                        password=validated_data['password'])
        user.save()
        return user


class NewSemesterNotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = NewSemesterNotification
        fields = '__all__'
