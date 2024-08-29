from django_cron import CronJobBase, Schedule
from .models import Course, CourseSection
from .utils import get_current_year, get_current_term_code, get_current_term
import requests
import logging

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
                        instructor = course_details.get("instructor", [])
                        course_schedules = course_details.get("courseSchedule", [])
                        required_text = course_details.get("requiredText", [])

                        first_instructor = instructor[0] if instructor else {}

                        # Step 4: Store or update the course in the database
                        course_obj, created = Course.objects.update_or_create(
                            title=info.get("title", "Untitled Course"),
                            defaults={
                                # info
                                "title": info.get("title", "Untitled Course"),
                                "department": info.get("dept", department),
                                "class_number": info.get("classNumber", 0),
                                "course_number": info.get("number", 0),
                                "section_name": info.get("section", section_code),
                                "description": info.get("description", ""),
                                "term": info.get("term", ""),
                                "delivery_method": info.get("deliveryMethod", ""),

                                # instructor
                                "professor": first_instructor.get("name", "Unknown"),
                            },
                        )

                        # Step 5: Store course sections
                        for course_schedule in course_schedules:
                            CourseSection.objects.update_or_create(
                                course=course_obj,
                                section_code=section.get("sectionCode", ""),
                                defaults={
                                    "text": section.get("text", ""),
                                    "class_type": section.get("classType", ""),
                                    "associated_class": section.get("associatedClass", ""),
                                    "title": section.get("title", ""),
                                    "start_time": course_schedule.get("startTime", ""),
                                    "start_date": course_schedule.get("startDate", None),
                                    "end_time": course_schedule.get("endTime", ""),
                                    "end_date": course_schedule.get("endDate", None),
                                    "is_exam": course_schedule.get("isExam", False),
                                    "days": course_schedule.get("days", ""),
                                    "campus": course_schedule.get("campus", ""),
                                }
                            )

                        logger.info(f"Updated or created course: {info.get('title', 'Untitled Course')}")


            except requests.exceptions.RequestException as err:
                logger.error(f"Could not sync courses for {department}: {err}")

        logger.info("Course sync cron job completed.!!!!!!!!!!")

    def get_departments(self):
        return ['cmpt']  # TODO: Update this list with all relevant departments