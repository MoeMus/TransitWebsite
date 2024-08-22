from django_cron import CronJobBase, Schedule
from .models import Course
from .utils import get_current_year, get_current_semester_code
import requests

class SyncCoursesCronJob(CronJobBase):
    RUN_EVERY_MINS = 60  # 1 = one minute, 60 = one hour
    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'core.sync_courses_cron_job'  # Unique code for cron

    def do(self):
        current_year = get_current_year()
        current_term = get_current_semester_code()
