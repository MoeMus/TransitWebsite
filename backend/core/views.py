import logging
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken

from .utils import *
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# Create your views here.
CURRENT_SEMESTER = get_current_term_code()  # TODO: depreciate this variable since it is not used
CURRENT_YEAR = get_current_year()
CURRENT_TERM_CODE = get_current_term_code()
CURRENT_TERM = get_current_term()

# Logging/debugging for Python, using when returning response errors
logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data["refresh_token"]
        refresh_token = RefreshToken(refresh_token)
        refresh_token.blacklist()

        response = Response(status=status.HTTP_205_RESET_CONTENT)

        if 'user_session' in request.COOKIES:
            response.delete_cookie('user_session')

        return response

    except Exception as e:
        return Response({"error": "Logout failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def test_view(request):
    return HttpResponse('Test view')
