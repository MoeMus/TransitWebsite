import uuid
from datetime import timedelta, datetime

from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.crypto import get_random_string

model = models.Model


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


# Class representing a course a student is taking
class Course(models.Model):
    DoesNotExist = None
    objects = models.Manager()  # Explicitly adding objects manager

    title = models.CharField(max_length=100, default='Untitled', db_index=True)
    department = models.CharField(max_length=100, default='No department')
    course_number = models.CharField(max_length=10, default='000')  # 125, 225, etc.

    # The __str method below makes the Django Course model readable for when you do print(course)
    def __str__(self):

        return f"{self.department} {self.course_number} - {self.title}"

    def save(self, *args, **kwargs):
        self.department = self.department.upper()
        super().save(*args, **kwargs)


class LectureSection(models.Model):
    DoesNotExist = None
    objects = models.Manager()

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="lecture_sections",
        null=True,
    )

    section_code = models.CharField(max_length=10)
    start_time = models.TimeField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    schedule = models.JSONField(null=True, blank=True)
    campus = models.CharField(max_length=50, null=True, blank=True)
    class_type = models.CharField(max_length=10, null=True, blank=True)
    professor = models.CharField(max_length=100, null=True, blank=True)
    associated_class = models.CharField(max_length=50, default=0)
    title = models.CharField(max_length=100, default='Untitled')
    department = models.CharField(max_length=100, default='No department')
    number = models.CharField(max_length=100, default='000')
    delivery_method = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.section_code} (Lecture)"

    def save(self, *args, **kwargs):
        self.department = self.department.upper()
        super().save(*args, **kwargs)


# Represents a section of a course (Tutorial, Lab, etc.)
class NonLectureSection(models.Model):
    DoesNotExist = None
    objects = models.Manager()

    lecture_section = models.ForeignKey(
        LectureSection,
        on_delete=models.CASCADE,
        related_name='non_lecture_sections',  # Explicit reverse relation
        null=True,
        default=None,
    )
    section_code = models.CharField(max_length=10)
    class_type = models.CharField(max_length=10)  # e.g., "e" or "n"
    associated_class = models.CharField(max_length=10, default=0)
    title = models.CharField(max_length=100, default="Untitled")
    start_time = models.TimeField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    schedule = models.JSONField(null=True, blank=True)
    campus = models.CharField(max_length=100, null=True, blank=True)
    professor = models.CharField(max_length=100, null=True, blank=True)
    department = models.CharField(max_length=100, default='No department')
    number = models.CharField(max_length=100, default='000')

    def __str__(self):
        return f"{self.title} - {self.section_code} ({self.class_type})"

    def save(self, *args, **kwargs):
        self.department = self.department.upper()
        super().save(*args, **kwargs)


class User(AbstractUser):
    DoesNotExist = None
    lecture_sections = models.ManyToManyField('LectureSection', related_name='users', blank=True)
    non_lecture_sections = models.ManyToManyField('NonLectureSection', related_name='users', blank=True)

    # One-Time Password for password reset
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry_date = models.DateTimeField(blank=True, null=True)
    otp_verified = models.BooleanField(default=False)

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

    def generate_otp(self):

        self.otp = get_random_string(6, allowed_chars='1234567890abcdefghijklmnopqrstuvwsyz')
        self.otp_expiry_date = datetime.now() + timedelta(minutes=10)   # 10-minute window
        self.otp_verified = False
        self.save()


# A notification to a user that their schedule has been cleared for the next semester
class NewSemesterNotification(models.Model):

    DoesNotExist = None
    objects = models.Manager()

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='new_semester_notifications',
        null=True,
        default=None,
    )

    message = models.TextField()

    term = models.CharField(
        max_length=6,
        null=True,
        choices=Semester.choices,
        default=None
    )

    year = models.IntegerField()

    def __str__(self):
        return f"{self.user} - {self.message} - {self.term} - {self.year}"
