from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission

model = models.Model


#Class representing a course a student is taking
class Course(models.Model):
    objects = models.Manager()  # Explicitly adding objects manager

    # Semester inner class for defining Semester TextChoices
    class Semester(models.TextChoices):
        SPRING = "1", "Spring"
        SUMMER = "2", "Summer"
        FALL = "3", "Fall"

    class Component(models.TextChoices):
        LAB = "LAB", "Lab"
        TUTORIAL = "TUT", "Tutorial"
        SEMINAR = "SEM", "Seminar"
        LECTURE = "LEC", "Lecture"

    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    course_number = models.IntegerField()
    professor = models.CharField(max_length=100)
    section_name = models.CharField(max_length=100, default='D100')  #D100, E200, etc.
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


class User(AbstractUser):
    DoesNotExist = None
    Courses = models.ManyToManyField('Course', related_name='users', blank=True)

    groups = models.ManyToManyField(
        Group,
        related_name='core_users',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        verbose_name='groups',
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name='core_users',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
