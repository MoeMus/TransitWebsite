from django.core.exceptions import ObjectDoesNotExist
from django_cron import CronJobBase, Schedule
from .models import Course, LectureSection, NonLectureSection
from .utils import get_current_year, get_current_term_code, get_current_term
import requests
import logging
from django.utils.dateparse import parse_time
from dateutil import parser

# Course.objects.all().delete()  # TODO: For debugging only

logger = logging.getLogger(__name__)


class SyncCoursesCronJob(CronJobBase):
    RUN_EVERY_MINS = 60  # 1 = one minute, 60 = one hour
    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'core.sync_courses_cron_job'  # Unique code for cron

    def do(self):
        logger.info("Starting course sync cron job.")

        current_year = get_current_year()
        current_term_code = get_current_term_code()
        current_term = get_current_term()
        departments = self.get_departments()

        for department in departments:
            try:

                department = department.upper()

                logger.info(f"Fetching courses for department: {department}")

                courses_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}"
                courses_response = requests.get(courses_url)
                courses_response.raise_for_status()
                courses = courses_response.json()
                logger.info(f"Found {len(courses)} courses in department {department}.")

                for course in courses:
                    course_number = course.get("value")
                    logger.info(f"Processing course number: {course_number}")

                    course_obj, created = Course.objects.get_or_create(
                        title=course.get("title", "Untitled Course"),
                        department=department,
                        course_number=course_number,
                    )

                    sections_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}/{course_number}"
                    sections_response = requests.get(sections_url)
                    sections_response.raise_for_status()
                    sections = sections_response.json()

                    # Step 1: Create or update the course first
                    for section in sections:
                        section_code = section.get("text")
                        associated_class = section.get("associatedClass")
                        section_title = section.get("title")
                        text_value = section.get("text")

                        logger.info(f"Processing section: {section_code} for course {course_number}")

                        details_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}/{course_number}/{section_code}"
                        details_response = requests.get(details_url)
                        details_response.raise_for_status()
                        section_details = details_response.json()

                        logger.debug(f"Course details fetched: {section_details} with url: {details_url}")

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

                        first_instructor = section_details.get("instructor", [{}])[
                            0]  # Get first instructor if available

                        if section.get("sectionCode") in ["LEC", "IND"] and text_value == info.get("section"):
                            # Create LectureSection

                            lecture_section, lec_created = LectureSection.objects.update_or_create(
                                course=course_obj,
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
                                    "department": department,
                                    "number": info.get("number", "000"),
                                    "delivery_method": section_details.get("deliveryMethod", "")
                                },
                            )
                            logger.info(f"LectureSection created: {lecture_section}")
                        else:
                            # Check if the section is non-lecture (Lab, Tutorial, etc.)
                            if section.get("sectionCode") in ["LAB", "TUT", "SEM"]:
                                # Only create NonLectureSection if it is a recognized non-lecture section type
                                try:
                                    logger.info(f"Creating NonLectureSection for section {section_code}")

                                    instructor = first_instructor.get("name", "Unknown")

                                    corresponding_lecture_section = (LectureSection.
                                                                     objects.get(
                                                                         course=course_obj,
                                                                         professor=instructor,
                                                                         title=section_title
                                                                     ))

                                    NonLectureSection.objects.update_or_create(
                                        lecture_section=corresponding_lecture_section,
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
                                            "department": department,
                                            "number": info.get("number")
                                        }
                                    )
                                    logger.info(
                                        f"NonLectureSection created: {section_code} for {corresponding_lecture_section}")
                                except ObjectDoesNotExist:
                                    logger.error(
                                        f"LectureSection with associatedClass {associated_class} not found for section {section_code}")
                            else:
                                logger.info(f"Skipping section {section_code}, no non-lecture component.")

            except requests.exceptions.RequestException as err:
                logger.error(f"Could not sync courses for {department}: {err}")

        logger.info("Course sync cron job completed.")

    def get_departments(self):
        return ['cmpt']  # Update this list with all relevant departments


def parse_date(date_string):
    try:
        parsed_datetime = parser.parse(date_string)
        return parsed_datetime.date()
    except Exception as e:
        logger.error(f"Date parsing error: {e} with value {date_string}")
        return None
