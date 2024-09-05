import datetime
from datetime import time

DATE = datetime.datetime.now()

#Temporary solution for calculating semester
FALL_SEMESTER_MONTHS = ["09", "10", "11", "12"]
SPRING_SEMESTER_MONTHS = ["01", "02", "03", "04"]
SUMMER_SEMESTER_MONTHS = ["05", "06", "07", "08"]


def get_current_term_code():
    century = int(DATE.strftime("%C"))
    x = ((century + 1) % 10) * 1000
    y = (int(DATE.year) % 100) * 10
    z = get_current_term_code_season()
    return x + y + z


def get_current_year():
    return DATE.year


def get_current_term_code_season():
    month = DATE.strftime("%d")
    if month in SPRING_SEMESTER_MONTHS:
        return 1

    elif month in SUMMER_SEMESTER_MONTHS:
        return 4

    else:
        return 7


def get_current_term():
    month = DATE.strftime("%d")
    if month in SPRING_SEMESTER_MONTHS:
        return "spring"

    elif month in SUMMER_SEMESTER_MONTHS:
        return "summer"

    else:
        return "fall"


def check_time_conflicts(new_course, user_courses):
    conflicts = []

    # Iterate through schedules of the new course
    for new_schedule in new_course.lecturesection_set.all():

        # Compare with user's current courses' schedules
        for existing_course in user_courses:
            for existing_schedule in existing_course.lecturesection_set.all():

                # Check for time conflicts using the helper function
                if is_conflicting(new_schedule, existing_schedule):
                    conflicts.append({
                        "existing_course": existing_course.title,
                        "new_course": new_course.title,
                        "existing_schedule": existing_schedule.section_code,
                        "new_schedule": new_schedule.section_code
                    })

    return conflicts


# Helper function for check_time_conflicts
def is_conflicting(new_schedule, existing_schedule):
    if new_schedule.days == existing_schedule.days:
        return (new_schedule.start_time <= existing_schedule.end_time and
                existing_schedule.start_time <= new_schedule.end_time)
    return False
