from datetime import date

from django.forms import model_to_dict
from django.utils import timezone

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction, IntegrityError
from django_cron import CronJobBase, Schedule
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .models import Course, LectureSection, NonLectureSection, User, NewSemesterNotification, OneTimePassword, \
    Department
from .utils import get_current_year, get_current_term_code, get_current_term
import requests
import logging
from django.utils.dateparse import parse_time
from dateutil import parser
from celery import shared_task
from celery.utils.log import get_task_logger

# Course.objects.all().delete()  # TODO: For debugging only

logger = logging.getLogger(__name__)

# class SyncCoursesCronJob(CronJobBase):
#     RUN_EVERY_MINS = 60  # 1 = one minute, 60 = one hour
#     schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
#     code = 'core.sync_courses_cron_job'  # Unique code for cron


# Scheduled job that deletes all blacklisted tokens or outstanding tokens that have expired
@shared_task(name="core.cron.remove_blacklisted_tokens")
def remove_blacklisted_tokens():
    logger.info("Removing Blacklisted Tokens")

    # Delete expired blacklisted tokens
    BlacklistedToken.objects.filter(token__expires_at__lt=timezone.now()).delete()

    # Delete expired outstanding tokens
    OutstandingToken.objects.filter(expires_at__lt=timezone.now()).delete()


@shared_task(name="core.cron.remove_expired_otps")
def remove_expired_otps():
    logger.info("Removing expired OTPs")
    OneTimePassword.objects.filter(otp_expiry_date__lt=timezone.now()).delete()


@shared_task(name="core.cron.update_course_data")
def update_course_data():
    logger.info("Starting course sync cron job.")

    current_year = get_current_year()
    current_term_code = get_current_term_code()
    current_term = get_current_term()

    try:

        clear_database()

    except IntegrityError:

        logger.exception("Course sync cron job failed: Could not clear database.")

        return

    departments = process_departments(current_year, current_term)

    for department in departments:

        courses = process_courses(current_year, current_term, department)

        for course in courses:

            process_course_sections(current_year, current_term, course, department)

    logger.info("Course sync cron job completed.")


def process_departments(current_year, current_term):
    departments_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}"
    response = requests.get(departments_url)
    departments = []
    for department_object in response.json():
        department_code = department_object.get("text")

        department_name = department_object.get("name")

        department_model, _ = Department.objects.update_or_create(
            code=department_code,
            defaults={
                "code": department_code,
                "name": department_name or "N/A"
            }
        )

        departments.append(department_model)

    return departments


def process_courses(current_year, current_term, department):
    department_code = department.code.upper()
    try:
        logger.info(f"Fetching courses for department: {department_code}")
        courses_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department_code}"
        courses_response = requests.get(courses_url)
        courses_response.raise_for_status()
        logger.info(f"Found {len(courses_response.json())} courses in department {department_code}.")
        courses = []

        for course in courses_response.json():

            course_number = course.get("value")
            logger.info(f"Processing course number: {course_number}")

            corresponding_department = Department.objects.get(code=department_code)

            course_model, _ = Course.objects.update_or_create(
                department_code=corresponding_department,
                title=course.get("title", "Untitled Course"),
                department=department_code,
                course_number=course_number,
            )

            courses.append(course_model)

        return courses
    except requests.exceptions.RequestException as err:
        logger.error(f"Could not sync courses for {department_code}: {err}")


def process_course_sections(current_year, current_term, course, department):
    course_number = course.course_number
    department_code = department.code.upper()
    try:
        sections_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department_code}/{course_number}"
        sections_response = requests.get(sections_url)
        sections_response.raise_for_status()
        sections = sections_response.json()

        for section in sections:
            section_code = section.get("text")
            associated_class = section.get("associatedClass")
            section_title = section.get("title")
            text_value = section.get("text")

            logger.info(f"Processing section: {section_code} for {department_code} {course_number}")

            details_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department_code}/{course_number}/{section_code}"
            details_response = requests.get(details_url)
            details_response.raise_for_status()
            section_details = details_response.json()

            info = section_details.get("info", {})
            schedule = section_details.get("courseSchedule", [])

            if schedule:
                campus = schedule[0].get("campus", "")
                start_date = parse_date(schedule[0].get("startDate", ""))
                end_date = parse_date(schedule[0].get("endDate", ""))
                start_time = parse_time(schedule[0].get("startTime", ""))
                end_time = parse_time(schedule[0].get("endTime", ""))

            else:
                campus = None
                start_date = None
                end_date = None
                start_time = None
                end_time = None

            first_instructor = section_details.get("instructor", [{}])[0]  # Get first instructor if available

            if section.get("sectionCode") in ["LEC", "IND", "OLC", "SEM"] and text_value == info.get("section"):
                # Create Lecture Section

                lecture_section, lec_created = LectureSection.objects.update_or_create(
                    course=course,
                    section_code=section_code,
                    defaults={
                        "start_time": start_time,
                        "start_date": start_date,
                        "end_time": end_time,
                        "end_date": end_date,
                        # "days": schedule.get("days", ""),
                        "schedule": schedule,
                        "campus": campus,
                        "class_type": section.get("classType", ""),
                        "professor": first_instructor.get("name", "Unknown"),
                        "associated_class": associated_class,
                        "title": section_title or "Untitled",
                        "department": department_code,
                        "number": info.get("number", "000"),
                        "delivery_method": section_details.get("deliveryMethod", "")
                    },
                )

                logger.info(f"LectureSection created: {department_code} {course_number} {section_code}")
            else:
                # Check if the section is non-lecture (Lab, Tutorial, etc.)
                if section.get("sectionCode") in ["LAB", "TUT", 'RQL', 'OPL', 'OLC', 'WKS']:
                    # Only create NonLectureSection if it is a recognized non-lecture section type

                    logger.info(f"Creating NonLectureSection for section {section_code}")

                    instructor = first_instructor.get("name", "Unknown")

                    corresponding_lecture_section = LectureSection.objects.filter(
                        course=course,
                        title=section_title,
                        associated_class=associated_class
                    ).first()

                    NonLectureSection.objects.update_or_create(
                        lecture_section=corresponding_lecture_section or None,
                        section_code=section_code,
                        defaults={
                            "start_time": start_time,
                            "start_date": start_date,
                            "end_time": end_time,
                            "end_date": end_date,
                            # "days": schedule.get("days", ""),
                            "campus": campus,
                            "schedule": schedule,
                            "class_type": section.get("classType", ""),
                            "professor": instructor,
                            "title": section_title,
                            "associated_class": associated_class,
                            "department": department_code,
                            "number": info.get("number")
                        }
                    )
                    logger.info(
                        f"NonLectureSection created: {department_code} {course_number} {section_code}")

                else:
                    logger.info(f"Skipping section {section_code}, no non-lecture component.")

    except requests.exceptions.RequestException as e:
        logger.error(
            f"Section(s) for {department_code} {course_number} not found. Error: {e}, skipping")


# Removes all old course data from database and clears every user's schedule
# TODO: Maybe instead of clearing the schedule, archive it instead
def clear_database():
    logger.info("Clearing DB")

    with transaction.atomic():
        NonLectureSection.objects.all().delete()
        LectureSection.objects.all().delete()
        Course.objects.all().delete()
        Department.objects.all().delete()
        users = User.objects.all()

        # Clear all user's schedules
        for user in users:
            upload_notification(user)

    logger.info("Finished Clearing DB")


def upload_notification(user):
    semester = get_current_term().title()
    today = date.today()

    new_notification = NewSemesterNotification.objects.update_or_create(
        user=user,
        defaults={
            'user': user,
            'message': f"Your schedule has been cleared. Please select your courses for the {semester} {today.year} "
                       f"semester",
            'term': semester,
            'year': today.year
        }
    )

    logger.info(f"New notification created: {new_notification}")


def parse_date(date_string):
    try:
        parsed_datetime = parser.parse(date_string)
        return parsed_datetime.date()
    except Exception as e:
        logger.error(f"Date parsing error: {e} with value {date_string}")
        return None
