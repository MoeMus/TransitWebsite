from zoneinfo import ZoneInfo

from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.utils.timezone import localtime, now
from rest_framework import serializers
from django.contrib.auth.hashers import check_password

from core.models import User, OneTimePassword


class BaseSerializer(serializers.Serializer):

    email = serializers.EmailField()

    def get_user_and_otp(self, email):
        try:

            user = User.objects.get(email=email)
            otp_object = OneTimePassword.objects.create_or_update(user=user)

        except User.DoesNotExist:

            raise serializers.ValidationError({"email": "User with this email does not exist."})

        return user, otp_object


# Sends email with OTP to user
class PasswordResetRequestSerializer(BaseSerializer):

    def validate_email(self, email):

        user, otp_object = self.get_user_and_otp(email)
        otp = get_random_string(length=6)

        # Generate OTP and send via email
        otp_object.generate_otp(otp)

        expiration_date = localtime(otp_object.otp_expiry_date, ZoneInfo("America/Vancouver"))

        send_mail(
            "TransitTail - Your Password Reset Verification Code",
            f"""
            Hello,

            We received a request to reset your password.
            
            Your verification code is {otp}.
            
            This code will expire in 10 minutes, at {expiration_date}. Please enter it promptly to continue resetting your password.
            
            If you did not request a password reset, you can safely ignore this email—your account will remain secure.
            """,
            "noreply@TransitTail.com",
            [user.email],
            fail_silently=False,
        )
        return email


# Validates the OTP sent by the user
class OTPVerificationSerializer(BaseSerializer):

    otp = serializers.CharField()

    def validate(self, data):

        _, otp_object = self.get_user_and_otp(data['email'])

        if not check_password(data['otp'], otp_object.password):

            raise serializers.ValidationError({"otp": "Verification code is invalid."})

        if otp_object.otp_expiry_date < now():

            raise serializers.ValidationError({"otp": "OTP has expired."})

        otp_object.otp_verified = True

        otp_object.save()

        return data


# Resets the password
class PasswordResetSerializer(BaseSerializer):

    new_password = serializers.CharField(write_only=True)

    def validate(self, data):

        _, otp_object = self.get_user_and_otp(data['email'])

        if not otp_object.otp_verified:
            raise serializers.ValidationError({"otp": "Verification code required."})

        return data

    def save(self, **kwargs):
        user = User.objects.get(email=self.validated_data["email"])
        user.set_password(self.validated_data["new_password"])
        user.otp = None  # Clear OTP after successful reset
        user.otp_expiry_date = None
        user.otp_verified = False  # Reset verification status
        user.save()

        return user
