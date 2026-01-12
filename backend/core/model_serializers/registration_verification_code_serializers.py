from zoneinfo import ZoneInfo

from django.core.mail import send_mail
from django.utils.timezone import localtime, now
from rest_framework import serializers
from django.contrib.auth.hashers import check_password
from django.utils.crypto import get_random_string

from core.models import OneTimePassword


class RegistrationVerificationCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):

        otp_object, created = OneTimePassword.objects.update_or_create(
            email=email,
            defaults={
                "email": email
            }
        )
        otp = get_random_string(length=6)

        otp_object.generate_otp(otp)

        expiration_date = localtime(otp_object.otp_expiry_date, ZoneInfo("America/Vancouver"))

        send_mail(
            "TransitTail - Your Account Verification Code",
            f"""
                Hello,

                Thank you for registering your account.
                
                Your verification code is {otp}.
                
                This code will expire in 10 minutes, at {expiration_date}. Please enter it promptly to complete your registration.
                
                If you did not request this code, you can safely ignore this email.
            """,
            "noreply@TransitTail.com",
            [email],
            fail_silently=False,
        )

        return email


class RegistrationVerifyOTPSerializer(serializers.Serializer):

    email = serializers.EmailField()
    otp = serializers.CharField()

    def validate(self, data):
        email = data["email"]
        otp = data["otp"]

        try:

            otp_object = OneTimePassword.objects.get(email=email)

        except OneTimePassword.DoesNotExist:

            raise serializers.ValidationError({"email": "No verification code was sent to that email."})

        if not check_password(otp, otp_object.otp):

            raise serializers.ValidationError({"otp": "Verification code is invalid."})

        if otp_object.otp_expiry_date < now():

            raise serializers.ValidationError({"otp": "Verification code has expired."})

        otp_object.otp_verified = True

        return data
