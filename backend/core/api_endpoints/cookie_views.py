import json

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def approve_cookie(request):
    if 'user_session' in request.COOKIES:
        return Response({"status: Cookie found"}, status=status.HTTP_200_OK)

    return Response({"error: Cookie not found"}, status=status.HTTP_404_NOT_FOUND)


# Create a new cookie

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_cookie(request):
    # cookie_info = {
    #     'access_token': request.data['access_token'],
    #     'refresh_token': request.data['refresh_token'],
    #     'username': request.data['username'],
    #     'Courses': request.data['Courses']
    # }
    user_data = json.loads(request.body)

    print(f"Data being put in the cookie: {json.dumps(request.data)}")
    response = Response({"status: Cookie successfully created"}, status=status.HTTP_201_CREATED)
    response.set_cookie(
        key='user_session',
        value=json.dumps(request.data),
        httponly=True,
        secure=True,  # Set to True if using HTTPS
        samesite='None',  # or 'None' if using HTTPS
        max_age=3600 * 24,
        path='/'
    )
    # print(response.cookies.get('user_session'))
    return response


# Retrieve user info from cookie
@api_view(['GET'])
def get_user_info_from_cookie(request):

    print(request.COOKIES)
    user_cookie = request.COOKIES.get('user_session')

    if user_cookie is None:
        return Response({'error': 'Cookie not found'}, status=status.HTTP_404_NOT_FOUND)

    user_info = json.loads(user_cookie)
    if user_info['access_token'] == "" or user_info['refresh_token'] == "" or user_info['username'] == "":
        return Response({'error': 'Cookie not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(user_info, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_cookie(request):
    response = Response({"status": 'Cookie not found'}, status=status.HTTP_200_OK)

    if 'user_session' in request.COOKIES:
        response = Response({'status': "Cookie deleted"}, status=status.HTTP_200_OK)
        response.delete_cookie('user_session')

    return response
