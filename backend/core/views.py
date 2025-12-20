import logging
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
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
    user = request.user

    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)

    response = Response(status=status.HTTP_204_NO_CONTENT)
    response.delete_cookie("user_session", path="/")
    return response


def test_view(request):
    return HttpResponse('Test view')
