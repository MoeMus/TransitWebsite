import datetime
from datetime import datetime

from datetime import date

# Get today's date
DATE = date.today()

# Temporary solution for calculating semester
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


SPRING_SEM_MONTHS = {1, 2, 3, 4}
SUMMER_SEM_MONTHS = {5, 6, 7, 8}
FALL_SEM_MONTHS = {9, 10, 11, 12}


def get_current_term():
    month_date = date.today()
    month = month_date.month

    if month in SPRING_SEM_MONTHS:
        return "spring"
    elif month in SUMMER_SEM_MONTHS:
        return "summer"
    else:
        return "fall"


# Returns a hash map that maps days to sections + the exact time block that occur on that day
def build_day_to_event_map(user_courses):
    day_to_event = {}

    for section in user_courses:

        schedule = section.schedule

        for block in schedule:

            days = [day.strip() for day in block["days"].split(", ")]

            # Store both the section and the time block during that day
            map_entry = {
                "section": section,
                "time_block": block
            }

            for day in days:

                if day not in day_to_event:
                    day_to_event[day] = []

                day_to_event[day].append(map_entry)

    return day_to_event


def to_time(t: str):
    return datetime.strptime(t, "%H:%M").time()


def check_course_conflicts(block1, block2):

    start_time1 = to_time(block1["startTime"])
    start_time2 = to_time(block2["startTime"])

    end_time1 = to_time(block1["endTime"])
    end_time2 = to_time(block2["endTime"])

    return start_time1 < end_time2 and start_time2 < end_time1


# Checks a new course's time conflicts with the current user's courses.
# Uses helper function is_conflicting to check if a schedule conflicts
def check_time_conflicts(new_course, user_courses):
    conflicts = set()
    day_to_event_map = build_day_to_event_map(user_courses)

    for block in new_course.schedule:
        days = [day.strip() for day in block["days"].split(",")]

        for day in days:

            for course in day_to_event_map.get(day, []):

                if check_course_conflicts(block, course["time_block"]):

                    conflicts.add(course["section"].id)

    print("Conflict detected")

    return list(conflicts)
