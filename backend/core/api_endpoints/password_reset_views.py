from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.serializers import PasswordResetSerializer, OTPVerificationSerializer, PasswordResetRequestSerializer


@api_view(["POST"])
def request_password_reset(request):
    serializer = PasswordResetRequestSerializer(data=request.data)

    if serializer.is_valid():
        return Response({"success": f"Verification code sent to {request.data['email']}."},
                        status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def validate_otp(request):
    serializer = OTPVerificationSerializer(data=request.data)

    if serializer.is_valid():
        return Response({"success": "OTP verified."}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def reset_password(request):

    serializer = PasswordResetSerializer(data=request.data)

    if serializer.is_valid():

        serializer.save()

        return Response({"success": "Password reset successfully."}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
