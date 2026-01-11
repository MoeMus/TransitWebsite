from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from core.serializers import PasswordResetSerializer, OTPVerificationSerializer, PasswordResetRequestSerializer


@api_view(["POST"])
@throttle_classes([ScopedRateThrottle])
def request_password_reset(request):
    request_password_reset.throttle_scope = 'password_reset_request'

    serializer = PasswordResetRequestSerializer(data=request.data)

    if serializer.is_valid():
        return Response({"success": f"Verification code sent to {request.data['email']}."},
                        status=status.HTTP_200_OK)

    first_error = next(iter(serializer.errors.values()))[0]

    return Response({"error": first_error}, status=status.HTTP_400_BAD_REQUEST)


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
