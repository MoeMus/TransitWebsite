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


def check_time_conflicts(new_course_schedule, user_courses):
    conflicts = []

    # Iterate through the user's courses
    for course in user_courses:
        for schedule in course.course_schedule:
            if new_course_schedule['days'] == schedule['days']:
                # Parse the times
                new_start_time = time.fromisoformat(new_course_schedule['start_time'])
                new_end_time = time.fromisoformat(new_course_schedule['end_time'])
                existing_start_time = time.fromisoformat(schedule['start_time'])
                existing_end_time = time.fromisoformat(schedule['end_time'])

                # Check if there is a time conflict
                if is_time_overlap(new_start_time, new_end_time, existing_start_time, existing_end_time):
                    conflicts.append(course.title)

    return conflicts


# Helper function for check_time_conflicts
def is_time_overlap(start1, end1, start2, end2):
    return (start1 <= end2) and (end1 >= start2)