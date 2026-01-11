from datetime import datetime
from zoneinfo import ZoneInfo
from django.db import IntegrityError, transaction
from django.forms import model_to_dict
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from core.models import User, LectureSection, NonLectureSection, NewSemesterNotification
from core.serializers import UserSerializer, LectureSectionSerializer, NonLectureSectionSerializer, NewSemesterNotificationSerializer
from core.utils import check_time_conflicts, refresh_courses_if_stale


class UserView(APIView):

    def get_permissions(self):
        if self.request.method == "GET" or self.request.method == "DELETE" or self.request.method == "PUT":
            return [IsAuthenticated()]
        return [AllowAny()]

    # Retrieve user info if logged in
    def get(self, request):

        refresh_courses_if_stale()

        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def delete(self, request):

        # Remove any outstanding tokens currently used
        for token in OutstandingToken.objects.filter(user=request.user):
            BlacklistedToken.objects.get_or_create(token=token)

        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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


# Retrieves all courses (lecture sections and non lecture sections) for a user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_courses(request):
    user = request.user
    lecture_sections = user.lecture_sections.all()
    non_lecture_sections = user.non_lecture_sections.all()
    response_data = {
        "lecture_sections": LectureSectionSerializer(lecture_sections, many=True).data,
        "non_lecture_sections": NonLectureSectionSerializer(non_lecture_sections, many=True).data
    }
    return Response(response_data, status=status.HTTP_200_OK)


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
    lecture_section_code = request.data["lecture_section_code"]
    non_lecture_section_code = request.data.get("non_lecture_section_code", None)
    user = request.user

    # Get the user's courses by username
    user_courses = list(user.lecture_sections.all())
    user_courses += list(user.non_lecture_sections.all())

    error_response = None

    # Gracefully catch any errors that could occur
    try:

        with transaction.atomic():

            existing_courses = [course for course in user_courses if course.department == department and
                                course.number == course_number and
                                (course.section_code == lecture_section_code or
                                course.section_code == non_lecture_section_code or "")
                                ]

            if existing_courses:
                return Response(
                    {"error": f"{existing_courses[0].department} {existing_courses[0].number} "
                              f"{existing_courses[0].section_code} is already in your schedule"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            new_lecture_section = LectureSection.objects.filter(department=department, number=course_number,
                                                                section_code=lecture_section_code).first()

            if new_lecture_section:

                conflicts = check_time_conflicts(new_lecture_section, user_courses)

                if conflicts:

                    error_response = Response({
                        "error": "Time conflicts detected",
                        "section": model_to_dict(new_lecture_section),
                        "conflicts": conflicts
                    }, status=status.HTTP_409_CONFLICT)

                    raise Exception

                non_lecture_section = None

                if non_lecture_section_code:

                    non_lecture_section = NonLectureSection.objects.filter(department=department, number=course_number,
                                                                           section_code=non_lecture_section_code).first()

                    conflicts = check_time_conflicts(non_lecture_section, user_courses)

                    if conflicts:

                        error_response = Response({
                            "error": "Time conflicts detected",
                            "section": model_to_dict(non_lecture_section),
                            "conflicts": conflicts
                        }, status=status.HTTP_409_CONFLICT)

                        raise Exception

                user.lecture_sections.add(new_lecture_section)
                if non_lecture_section:
                    user.non_lecture_sections.add(non_lecture_section)

            user.save()

    except Exception as e:

        if error_response is not None:
            return error_response
        return Response({"error": "Could not add course to your schedule"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_next_class(request):
    user = request.user
    # Enforce Vancouver timezone for accurate class scheduling
    vancouver_tz = ZoneInfo("America/Vancouver")
    now = datetime.now(vancouver_tz)

    # Map python weekday (0=Monday) to schedule string format
    days_map = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
    current_day_str = days_map[now.weekday()]
    current_time_str = now.strftime("%H:%M")

    upcoming_classes = []

    def check_sections(sections):
        for section in sections:
            if not section.schedule:
                continue
            for block in section.schedule:
                if current_day_str in block.get("days", ""):
                    start_time = block.get("startTime")
                    if start_time and start_time > current_time_str:
                        h, m = map(int, start_time.split(':'))

                        # Format time for display without leading 0, e.g. "02:30 PM" to "2:30 PM"
                        display_time = datetime.strptime(start_time, "%H:%M").strftime("%I:%M %p").lstrip('0')

                        upcoming_classes.append({
                            "title": section.title,
                            "nextStartTime": start_time,
                            "displayTime": display_time,
                            "startTimeInMinutes": h * 60 + m,
                            "campus": section.campus,
                        })

    check_sections(user.lecture_sections.all())
    check_sections(user.non_lecture_sections.all())

    if not upcoming_classes:
        return Response(None, status=status.HTTP_204_NO_CONTENT)

    # Sort by start time (earliest first)
    upcoming_classes.sort(key=lambda x: x['startTimeInMinutes'])

    return Response(upcoming_classes[0], status=status.HTTP_200_OK)


# Gets a notification for the user that the new semester has started
# Once received, the notification is deleted to save DB space
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_new_semester_notification(request):

    user = request.user

    with transaction.atomic():

        notification = NewSemesterNotification.objects.select_for_update().filter(user=user).first()

        if notification:

            response = Response(NewSemesterNotificationSerializer(notification).data, status=status.HTTP_200_OK)

            notification.delete()

        else:

            response = Response(None, status=status.HTTP_200_OK)

    return response
