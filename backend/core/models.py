from django.db import models
from django.contrib.auth.models import AbstractUser
model = models.Model


class User(AbstractUser):
    Courses = []


class Course(model):
    # Semester inner class for defining Semester TextChoices
    class Semester(models.TextChoices):
        SPRING = "Spring"
        SUMMER = "Summer"
        FALL = "FALL"

        SEMESTER_CHOICES = (
            (SPRING, 'Spring'),
            (SUMMER, 'Summer'),
        )

    class Component(models.Textchoices):
        LAB = "Lab"
        TUTORIAL = "Tutorial"
        SEMINAR = "Seminar"

    name = ""
    department = ""
    course_number = 0
    professor = ""

    semester = models.Charfield(
        choices=Semester.choices
    )
    component = models.Charfield(
        choices=Component.choices
    )



