from django_cron import CronJobBase, Schedule
from .models import Course
from .utils import get_current_year, get_current_semester_code
import requests
import logging

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
                        name=course_info.get("name")
                )
            except requests.exceptions.RequestException as err:
                logger.error(f"Could not sync courses for {department}: {err}")
    def get_departments(self):
        return ['CMPT'] #TODO: Change the list of departments