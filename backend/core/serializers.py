from django.core.mail import send_mail
from django.utils.timezone import now
from rest_framework import serializers
from .models import User, Course, LectureSection, NonLectureSection, NewSemesterNotification


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

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'lecture_sections', 'non_lecture_sections']
        # Password length is set to 128 characters per OWASP
        # https://owasp.deteact.com/cheat/cheatsheets/Authentication_Cheat_Sheet.html#password-length
        extra_kwargs = {
            'password': {'write_only': True, 'max_length': 128},
            'username': {'max_length': 50}
        }

    def create(self, validated_data):
        user = User.objects.create_user(email=validated_data['email'], username=validated_data['username'],
                                        password=validated_data['password'])
        user.save()
        return user


class NewSemesterNotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = NewSemesterNotification
        fields = '__all__'


# Sends email with OTP to user
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")

        # Generate OTP and send via email
        user.generate_otp()
        send_mail(
            "TransitTail - Password Reset OTP",
            f"Your OTP for password reset is {user.otp}",
            "noreply@example.com",
            [user.email],
            fail_silently=False,
        )
        return value


# Validates the OTP sent by the user
class OTPVerificationSerializer(serializers.Serializer):

    email = serializers.EmailField()
    otp = serializers.CharField()

    def validate_otp(self, data):

        try:

            user = User.objects.get(email=data["email"])

        except User.DoesNotExist:

            raise serializers.ValidationError("User with this email does not exist.")

        if user.otp != data["otp"]:

            raise serializers.ValidationError("OTP is incorrect.")

        if user.otp_expiry_date < now():

            raise serializers.ValidationError("OTP is expired.")

        user.otp_verified = True

        user.save()

        return data


# Resets the password
class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, data):

        try:
            user = User.objects.get(email=data["email"])

        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")

        if not user.otp_verified:
            raise serializers.ValidationError("OTP verification required.")

        return data

    def save(self, **kwargs):
        user = User.objects.get(email=self.validated_data["email"])
        user.set_password(self.validated_data["new_password"])
        user.otp = None  # Clear OTP after successful reset
        user.otp_expiry_date = None
        user.otp_verified = False  # Reset verification status
        user.save()

        return user
