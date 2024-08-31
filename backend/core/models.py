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

    # info
    title = models.CharField(max_length=100, default='Untitled')
    department = models.CharField(max_length=100, default='No department')
    class_number = models.CharField(max_length=20, default='000')
    course_number = models.CharField(max_length=10, default=0)
    section_name = models.CharField(max_length=100, default='D100')  # E.g. D100, E200, etc.
    description = models.TextField(null=True, blank=True)
    term = models.CharField(max_length=50, null=True, blank=True)
    delivery_method = models.CharField(max_length=50, null=True, blank=True)

    #  instructor
    #professor = models.CharField(max_length=100, null=True, blank=True)  # Professor field is optional, usually updated



    # The __str method below makes the Django Course model readable for when you do print(course)
    def __str__(self):
        #return f"{self.department} {self.course_number} - {self.title} ({self.section_name})"
        #return f"{self.department} {self.class_number}" old (before Aug 30)
        return f"{self.department} {self.course_number} - {self.title}"


class LectureSection(models.Model):
    # courseSchedule
    #    component = models.CharField(
    #        max_length=10,
    #        choices=Component.choices,
    #        default=Component.LECTURE # LECTURE is the default component
    #    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    section_code = models.CharField(max_length=10)
    start_time = models.CharField(max_length=50, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_time = models.CharField(max_length=50, null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_exam = models.BooleanField(default=False)
    days = models.CharField(max_length=50, null=True, blank=True)
    campus = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.course.title} - {self.section_code} (Lecture)"


# Represents a section of a course (Tutorial, Lab, etc.)
class NonLectureSection(models.Model):
    lecture_section = models.ForeignKey(LectureSection, on_delete=models.CASCADE, related_name='non_lecture_sections')
    section_code = models.CharField(max_length=10)
    text = models.CharField(max_length=100)  # e.g., "D100"
    class_type = models.CharField(max_length=10)  # e.g., "e" or "n"
    associated_class = models.CharField(max_length=10)  # e.g., "1"
    title = models.CharField(max_length=100)
    start_time = models.CharField(max_length=100, null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_time = models.CharField(max_length=100, null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_exam = models.BooleanField(default=False)
    days = models.CharField(max_length=100, null=True, blank=True)
    campus = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"{self.lecture_section.course.title} - {self.section_code} ({self.class_type})"


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
