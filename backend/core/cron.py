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
        current_year = get_current_year()
        current_term_code = get_current_term_code()
        current_term = get_current_term()
        departments = self.get_departments()

        for department in departments:
            try:
                course_numbers_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}"
                response = requests.get(course_numbers_url)
                response.raise_for_status()
                courses = response.json()

                for course_info in courses:
                    course_number = course_info.get("value")
                    if not course_number:
                        logger.warning(f"Skipping course due to missing course number: {course_info}")
                        continue

                    # Get the detailed course information
                    course_detail_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}/{course_number}"
                    detail_response = requests.get(course_detail_url)
                    detail_response.raise_for_status()
                    course_details = detail_response.json()

                    Course.objects.update_or_create(
                        title=course_info.get("title"),
                        defaults={ # TODO: Update course model with the given fields below
                            "department": department,
                            "course_number": course_info.get("number", 0),
                            "section_name": course_info.get("section", "D100"),
                            "description": course_info.get("description", ""),
                            "term": course_info.get("term", ""),
                            "delivery_method": course_info.get("deliveryMethod", ""),
                            "start_time": course_info.get("startTime", ""),
                            "start_date": course_info.get("startDate", None),
                            "end_time": course_info.get("endTime", ""),
                            "end_date": course_info.get("endDate", None),
                            "is_exam": course_info.get("isExam", False),
                            "days": course_info.get("days", ""),
                            "campus": course_info.get("campus", ""),
                        },
                    )

            except requests.exceptions.RequestException as err:
                logger.error(f"Could not sync courses for {department}: {err}")

    def get_departments(self):
        return ['CMPT'] #TODO: Change the list of departments