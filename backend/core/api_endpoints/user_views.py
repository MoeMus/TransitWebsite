from django.db import IntegrityError, transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from core.models import User, LectureSection, NonLectureSection
from core.serializers import UserSerializer, LectureSectionSerializer, NonLectureSectionSerializer
from core.utils import check_time_conflicts


class UserView(APIView):

    # Retrieve user info if logged in
    @permission_classes([IsAuthenticated])
    def get(self, request):

        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

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

        for token in OutstandingToken.objects.filter(user=request.user):
            BlacklistedToken.objects.get_or_create(token=token)

        request.user.delete()
        return Response(status=status.HTTP_200_OK)

    @permission_classes([IsAuthenticated])
    def put(self, request):

        try:

            with transaction.atomic():

                user = request.user
                serializer = UserSerializer(user, data=request.data)

                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_200_OK)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except IntegrityError:

            return Response({"error": "User with that username or email already exists"},
                            status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_courses(request):
    try:
        user = request.user
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
def remove_courses(request):
    try:

        with transaction.atomic():
            user = request.user
            user.lecture_sections.clear()
            user.non_lecture_sections.clear()
            user.save()
            return Response({"success": "All courses removed from schedule"}, status=status.HTTP_200_OK)

    except IntegrityError:

        return Response({"error": "Could not remove your courses"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Adds a course (lecture section or non lecture section) to a user's schedule
# Expects the request body to be a JSON representation of either a lecture section or non lecture section as defined
# in the models.py
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_course_to_schedule(request):
    department = request.data["department"]
    course_number = request.data["course_number"]
    section_code = request.data["section_code"]

    user = request.user

    # Get the user's courses by username
    user_courses = list(user.lecture_sections.all())
    user_courses += list(user.non_lecture_sections.all())

    existing_courses = [course for course in user_courses if course.department == department and
                        course.number == course_number and course.section_code == section_code]

    if existing_courses:
        return Response(
            {"error": "This section is already in your schedule"},
            status=status.HTTP_400_BAD_REQUEST
        )

    new_lecture_section = LectureSection.objects.filter(department=department, number=course_number,
                                                        section_code=section_code).first()

    if new_lecture_section:

        lecture_conflicts = check_time_conflicts(new_lecture_section, user_courses)
        if lecture_conflicts:
            conflict_sections = LectureSection.objects.filter(id__in=lecture_conflicts)

            return Response({
                "error": "Time conflicts detected",
                "conflicts": LectureSectionSerializer(conflict_sections, many=True).data
            }, status=status.HTTP_409_CONFLICT)

        user.lecture_sections.add(new_lecture_section)

    else:

        # If the provided data does not belong to any lecture section, try finding a non lecture section with the
        # corresponding data
        new_non_lecture_section = NonLectureSection.objects.filter(department=department, number=course_number,
                                                                   section_code=section_code).first()

        if new_non_lecture_section:

            non_lecture_conflicts = check_time_conflicts(new_non_lecture_section, user_courses)
            if non_lecture_conflicts:
                conflict_sections = NonLectureSection.objects.filter(id__in=non_lecture_conflicts)

                return Response({
                    "error": "Time conflicts detected",
                    "conflicts": NonLectureSectionSerializer(conflict_sections, many=True).data,
                }, status=status.HTTP_409_CONFLICT)

            user.non_lecture_sections.add(new_non_lecture_section)

    user.save()

    return Response({"success": "Section added successfully"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_course_from_schedule(request):
    department = request.data["department"]
    course_number = request.data["course_number"]
    section_code = request.data["section_code"]

    with transaction.atomic():
        user = request.user

        lecture_section = LectureSection.objects.filter(department=department, number=course_number,
                                                        section_code=section_code).first()

        if lecture_section:

            non_lecture_section = user.non_lecture_sections.filter(lecture_section=lecture_section).first()

            user.lecture_sections.remove(lecture_section)
            if non_lecture_section:
                user.non_lecture_sections.remove(non_lecture_section)

        else:

            non_lecture_section = NonLectureSection.objects.filter(department=department, number=course_number,
                                                                   section_code=section_code).first()

            if non_lecture_section:
                user.non_lecture_sections.remove(non_lecture_section)

        user.save()

        return Response({"success": "Section removed successfully"}, status=status.HTTP_200_OK)
