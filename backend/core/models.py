from django.db import models
from django.contrib.auth.models import AbstractUser
model = models.Model


class User(AbstractUser):
    Courses = []


class Course(model):
    # Semester inner class for defining Semester TextChoices
    class Semester(models.TextChoices):
        SPRING = "1", "Spring"
        SUMMER = "2", "Summer"
        FALL = "3", "Fall"

    class Component(models.TextChoices):
        LAB = "Lab"
        TUTORIAL = "Tutorial"
        SEMINAR = "Seminar"

    name = ""
    department = ""
    course_number = 0
    professor = ""

    semester = models.CharField(
        max_length=10,
        choices=Semester.choices,
        default=Semester.SUMMER
    )
    component = models.CharField(
        max_length=10,
        choices=Component.choices,
        default=Component.LAB
    )
