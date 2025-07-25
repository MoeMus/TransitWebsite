from django.core.exceptions import ObjectDoesNotExist
from django_cron import CronJobBase, Schedule
from .models import Course, LectureSection, NonLectureSection
from .utils import get_current_year, get_current_term_code, get_current_term
import requests
import logging
from django.utils.dateparse import parse_time
from dateutil import parser


Course.objects.all().delete()  # TODO: For debugging only

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
                logger.info(f"Fetching courses for department: {department}")

                courses_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}"
                courses_response = requests.get(courses_url)
                courses_response.raise_for_status()
                courses = courses_response.json()
                logger.info(f"Found {len(courses)} courses in department {department}.")

                for course in courses:
                    course_number = course.get("value")
                    logger.info(f"Processing course number: {course_number}")

                    sections_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}/{course_number}"
                    sections_response = requests.get(sections_url)
                    sections_response.raise_for_status()
                    sections = sections_response.json()

                    # Step 1: Create or update the course first
                    for section in sections:
                        section_code = section.get("value")
                        associated_class = section.get("associatedClass")
                        section_title = section.get("title")
                        text_value = section.get("text")

                        logger.info(f"Processing section: {section_code} for course {course_number}")

                        details_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}/{course_number}/{section_code}"
                        details_response = requests.get(details_url)
                        details_response.raise_for_status()
                        course_details = details_response.json()

                        logger.debug(f"Course details fetched: {course_details} with url: {details_url}")

                        info = course_details.get("info", {})
                        course_schedules = course_details.get("courseSchedule", [])
                        first_instructor = course_details.get("instructor", [{}])[0]  # Get first instructor if available

                        course_obj, created = Course.objects.update_or_create(
                            title=info.get("title", "Untitled Course"),
                            department=info.get("dept", department),
                            class_number=info.get("classNumber", 0),
                            course_number=info.get("number", 0),
                            defaults={
                                "description": info.get("description", ""),
                                "term": info.get("term", ""),
                                "delivery_method": info.get("deliveryMethod", ""),
                                "section_name": info.get("section")
                            }
                        )

                        for schedule in course_schedules:
                            if section.get("sectionCode") == "LEC" and text_value == info.get("section"):
                                parsed_start_time = parse_time(schedule.get("startTime", ""))
                                parsed_end_time = parse_time(schedule.get("endTime", ""))
                                parsed_start_date = parse_date(schedule.get("startDate", ""))
                                parsed_end_date = parse_date(schedule.get("endDate", ""))

                                lecture_section = LectureSection.objects.create(
                                    course=course_obj,
                                    section_code=section_code,
                                    start_time=schedule.get("startTime", ""),
                                    start_date=parsed_start_date,
                                    end_time=schedule.get("endTime", ""),
                                    end_date=parsed_end_date,
                                    days=schedule.get("days", ""),
                                    campus=schedule.get("campus", ""),
                                    class_type=section.get("classType", ""),
                                    professor=first_instructor.get("name", "Unknown"),
                                    associated_class=associated_class,
                                    title=section_title or "Untitled",
                                    number=info.get("number", "000"),
                                )
                                logger.info(f"LectureSection created: {lecture_section}")
                            else:
                                # Check if the section is non-lecture (Lab, Tutorial, etc.)
                                if section.get("sectionCode") in ["LAB", "TUT", "SEM"]:
                                    # Only create NonLectureSection if it is a recognized non-lecture section type
                                    try:
                                        logger.info(f"Creating NonLectureSection for section {section_code}")
                                        NonLectureSection.objects.create(
                                            lecture_section=lecture_section,  # Associate with LectureSection if needed
                                            section_code=section_code,
                                            associated_class=associated_class,
                                            start_time=parse_time(schedule.get("startTime", "")),
                                            start_date=parse_date(schedule.get("startDate", "")),
                                            end_time=parse_time(schedule.get("endTime", "")),
                                            end_date=parse_date(schedule.get("endDate", "")),
                                            days=schedule.get("days", ""),
                                            campus=schedule.get("campus", ""),
                                            class_type=section.get("classType", ""),
                                            professor=first_instructor.get("name", "Unknown"),
                                            title=section_title,
                                            number=info.get("number")
                                        )
                                        logger.info(f"NonLectureSection created: {section_code} for {lecture_section}")
                                    except ObjectDoesNotExist:
                                        logger.error(f"LectureSection with associatedClass {associated_class} not found for section {section_code}")
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
