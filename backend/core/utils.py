import datetime

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
