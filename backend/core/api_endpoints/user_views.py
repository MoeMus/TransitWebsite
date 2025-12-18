from django.db import IntegrityError, transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import User, LectureSection, NonLectureSection
from core.serializers import UserSerializer, LectureSectionSerializer, NonLectureSectionSerializer
from core.utils import check_time_conflicts


class UserView(APIView):

    # Retrieve user info if logged in
    @permission_classes([IsAuthenticated])
    def get(self, request):

        username = request.query_params.get('username')

        try:
            current_user = User.objects.get(username=username)
            serializer = UserSerializer(current_user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User: " + username + " not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):

        try:

            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            else:
                return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        except IntegrityError:

            return Response({"error": "User with that username or email already exists"},
                            status=status.HTTP_400_BAD_REQUEST)

    @permission_classes([IsAuthenticated])
    def delete(self, request):

        username = request.query_params.get('username', None)
        try:
            user = User.objects.get(username=username)
            user.delete()
            return Response(status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "Account not found"}, status=status.HTTP_404_NOT_FOUND)

    @permission_classes([IsAuthenticated])
    def put(self, request):

        try:

            with transaction.atomic():

                user = User.objects.get(username=request.data['username'])

                if user.DoesNotExist:

                    return Response({"error": "Account not found"}, status=status.HTTP_404_NOT_FOUND)

                serializer = UserSerializer(user, data=request.data)

                if serializer.is_valid():

                    serializer.save()

        except IntegrityError:

            return Response({"error": "User with that username or email already exists"},
                            status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_courses(request, username):

    try:

        user = get_object_or_404(User, username=username)
        lecture_sections = user.lecture_sections.all()
        non_lecture_sections = user.non_lecture_sections.all()

        response_data = {
            "lecture_sections": LectureSectionSerializer(lecture_sections, many=True).data,
            "non_lecture_sections": NonLectureSectionSerializer(non_lecture_sections, many=True).data
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Http404 as e:

        return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)


# Deletes all courses from a user's schedule
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_courses(self, request):

    try:

        with transaction.atomic():
            user = User.objects.get(username=request.POST.data["username"])
            user.courses.all().delete()
            user.save()
            return Response(status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)


# Adds a course (lecture section or non lecture section) to a user's schedule
# Expects the request body to be a JSON representation of either a lecture section or non lecture section as defined
# in the models.py

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_course_to_schedule(request):
    username = request.data['username']
    course_name = request.data["course_name"]
    section_name = request.data["section_name"]

    try:

        user = get_object_or_404(User, username=username)

        # Get the user's courses by username
        existing_courses = list(user.lecture_sections.all())
        existing_courses += list(user.non_lecture_sections.all())

        new_lecture_section = LectureSection.objects.filter(title=course_name, section_code=section_name).first()

        if new_lecture_section:

            lecture_conflicts = check_time_conflicts(new_lecture_section, existing_courses)
            if lecture_conflicts:

                return Response({
                    "error": "Time conflicts detected",
                    "conflicts": lecture_conflicts
                }, status=status.HTTP_409_CONFLICT)

            user.lecture_sections.add(new_lecture_section)

        else:

            # If the provided data does not belong to any lecture section, try finding a non lecture section with the
            # corresponding data

            new_non_lecture_section = NonLectureSection.objects.filter(title=course_name, section_code=section_name).first()

            if new_non_lecture_section:
                non_lecture_conflicts = check_time_conflicts(new_non_lecture_section, existing_courses)
                if non_lecture_conflicts:

                    return Response({
                        "error": "Time conflicts detected",
                        "conflicts": non_lecture_conflicts,
                    }, status=status.HTTP_409_CONFLICT)

                user.non_lecture_sections.add(new_non_lecture_section)

        user.save()

        return Response({"success": "Section added successfully"}, status=status.HTTP_200_OK)

    except Http404 as e:

        return Response({"error": "No user found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_course_from_schedule(request):
    username = request.data['username']
    course_name = request.data["course_name"]
    section_name = request.data["section_name"]

    try:

        with transaction.atomic():

            user = get_object_or_404(User, username=username)

            lecture_section = LectureSection.objects.filter(title=course_name, section_code=section_name).first()

            if lecture_section:

                non_lecture_section = user.non_lecture_sections.filter(lecture_section=lecture_section).first()

                user.lecture_sections.remove(lecture_section)
                user.non_lecture_sections.remove(non_lecture_section)

            else:

                non_lecture_section = NonLectureSection.objects.get(title=course_name, section_code=section_name)
                user.non_lecture_sections.remove(non_lecture_section)

            user.save()

            return Response({"success": "Section removed successfully"}, status=status.HTTP_200_OK)

    except Http404 as e:

        return Response({"error": "course could not be removed from your schedule"},
                        status=status.HTTP_404_NOT_FOUND)
