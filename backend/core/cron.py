from django_cron import CronJobBase, Schedule
from .models import Course
from .utils import get_current_year, get_current_term_code, get_current_term
import requests
import logging

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

                # Step 1: Get the list of courses for the department
                courses_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}"
                courses_response = requests.get(courses_url)
                courses_response.raise_for_status()
                courses = courses_response.json()
                logger.info(f"Found {len(courses)} courses in department {department}.")

                for course in courses:
                    course_number = course.get("value")
                    logger.info(f"Processing course number: {course_number}")

                    # Step 2: Get the list of sections for the course
                    sections_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}/{course_number}"
                    sections_response = requests.get(sections_url)
                    sections_response.raise_for_status()
                    sections = sections_response.json()

                    for section in sections:
                        section_code = section.get("value")
                        logger.info(f"Processing section: {section_code} for course {course_number}")

                        # Step 3: Get the detailed information for each section
                        details_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}/{course_number}/{section_code}"
                        details_response = requests.get(details_url)
                        details_response.raise_for_status()
                        course_details = details_response.json()

                        logger.debug(f"Course details fetched: {course_details} with url: {details_url}")

                        info = course_details.get("info", {})

                        # Step 4: Store or update the course in the database
                        Course.objects.update_or_create(
#                            title=course_details.get("title", "Untitled Course"),
#                            defaults={
                                title=info.get("title", "Untitled Course"),
                                department=info.get("dept", department),
                                class_number=info.get("classNumber", 0),
                                course_number=info.get("number", 0),
                                section_name=info.get("section", section_code),
#                                "description": course_details.get("description", ""),
                                term=info.get("term", ""),
#                                "delivery_method": course_details.get("deliveryMethod", ""),
#                                "start_time": course_details.get("startTime", ""),
#                                "start_date": course_details.get("startDate", None),
#                                "end_time": course_details.get("endTime", ""),
#                                "end_date": course_details.get("endDate", None),
#                                "is_exam": course_details.get("isExam", False),
#                                "days": course_details.get("days", ""),
#                                "campus": course_details.get("campus", ""),
                                professor=info.get("professor", "Unknown")
#                            },
                        )
                        logger.info(f"Updated or created course: {course_details.get('title', 'Untitled Course')}")

            except requests.exceptions.RequestException as err:
                logger.error(f"Could not sync courses for {department}: {err}")

        logger.info("Course sync cron job completed.!!!!!!!!!!")

    def get_departments(self):
        return ['cmpt']  # TODO: Update this list with all relevant departments