from itertools import chain

from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Course, LectureSection, NonLectureSection
from core.serializers import CourseSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_course(request, department, course_number):
    try:

        # Check if the course exists in our database of all courses
        course = get_object_or_404(Course, title=department, number=course_number)

        return Response(CourseSerializer(course).data, status=status.HTTP_200_OK)

    except Http404 as e:

        return Response({"error": "Course does not exist"}, status=status.HTTP_404_NOT_FOUND)


# Given a set of course IDs, retrieve the course info associated with each section as a list
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_courses_from_ids(request):
    course_id_params = request.query_params.get('course_ids', '')

    course_ids = []

    if course_id_params:

        course_ids = [course_id for course_id in course_id_params.split(',')]

    courses = Course.objects.filter(id__in=course_ids).values()
    if not courses:
        return Response({"error": "Courses could not be retrieved"}, status=status.HTTP_400_BAD_REQUEST)

    lecture_sections_no_lab = LectureSection.objects.filter(course_id__in=course_ids).values()

    titles = [course['title'] for course in courses]
    section_codes = [course['section_name'] for course in courses]
    course_numbers = [course['course_number'] for course in courses]

    non_lecture_components = NonLectureSection.objects.filter(number__in=course_numbers,
                                                              title__in=titles,
                                                              section_code__in=section_codes).values()

    non_lecture_professors = [component['professor'] for component in non_lecture_components]
    non_lecture_titles = [component['title'] for component in non_lecture_components]
    non_lecture_numbers = [component['number'] for component in non_lecture_components]

    lecture_sections_with_lab = LectureSection.objects.filter(professor__in=non_lecture_professors,
                                                              number__in=non_lecture_numbers,
                                                              title__in=non_lecture_titles).values()

    lecture_sections = list(
        {tuple(section.items()) for section in chain(lecture_sections_no_lab, lecture_sections_with_lab)})

    lecture_sections = [dict(section) for section in lecture_sections]

    return Response({"lecture_sections": list(lecture_sections),
                     "non_lecture_sections": list(non_lecture_components)},
                    status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_all_courses(request):
    courses = Course.objects.all().values()
    return JsonResponse(list(courses), safe=False, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_lecture_sections(request, course_id: int):
    try:

        course = get_object_or_404(Course, id=course_id)

        lecture_sections = course.lecture_sections.all()  # Fetch related lecture sections
        data = [{"id": ls.id, "department": ls.department, "number": ls.number, "title": ls.title,
                 "section_code": ls.section_code, "professor": ls.professor, "schedule": ls.schedule,
                 "start_date": ls.start_date, "end_date": ls.end_date, "campus": ls.campus}
                for ls in lecture_sections
                ]

        return JsonResponse(data, safe=False, status=status.HTTP_200_OK)

    except Http404 as e:

        return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_non_lecture_sections(request, lecture_section_id):
    try:

        lecture_section = get_object_or_404(LectureSection, id=lecture_section_id)
        non_lecture_sections = lecture_section.non_lecture_sections.all()  # Use the new related_name
        data = [
            {"id": nls.id, "department": nls.department, "number": nls.number, "title": nls.title, "section_code": nls.section_code,
             "professor": nls.professor, "schedule": nls.schedule,
             "start_date": nls.start_date, "end_date": nls.end_date, "campus": nls.campus}
            for nls in non_lecture_sections
        ]
        return JsonResponse(data, safe=False, status=status.HTTP_200_OK)

    except Http404 as e:
        return Response({"error": "Lecture section not found"}, status=status.HTTP_404_NOT_FOUND)
