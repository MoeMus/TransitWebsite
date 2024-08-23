from django_cron import CronJobBase, Schedule
from .models import Course
from .utils import get_current_year, get_current_semester_code
import requests
import logging

logger = logging.getLogger(__name__)

class SyncCoursesCronJob(CronJobBase):
    RUN_EVERY_MINS = 60  # 1 = one minute, 60 = one hour
    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'core.sync_courses_cron_job'  # Unique code for cron

    def do(self):
        current_year = get_current_year()
        current_term = get_current_semester_code()
        departments = self.get_departments()

        for department in departments:
            try:
                api_url = f"https://www.sfu.ca/bin/wcm/course-outlines?{current_year}/{current_term}/{department}"
                response = requests.get(api_url)
                response.raise_for_status()
                courses = response.json()

                for course_info in courses:
                    Course.objects.update_or_create(
                        name=course_info.get("name"),
                        defaults={ # TODO: Update course model with the given fields below
                            "department": course_info.get("dept"),
                            "course_number": course_info.get("number"),
                            "title": course_info.get("title"),
                            "section_name": course_info.get("section"),
                            "description": course_info.get("description"),
                            "term": course_info.get("term"),
                            "delivery_method": course_info.get("deliveryMethod"),
                            "start_time": course_info.get("startTime"),
                            "start_date": course_info.get("startDate"),
                            "end_time": course_info.get("endTime"),
                            "end_date": course_info.get("endDate"),
                            "is_exam": course_info.get("isExam"),
                            "days": course_info.get("days"),
                            "campus": course_info.get("campus"),
                        },
                )

            except requests.exceptions.RequestException as err:
                logger.error(f"Could not sync courses for {department}: {err}")

    def get_departments(self):
        return ['CMPT'] #TODO: Change the list of departments