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

    title = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    value = models.CharField(max_length=10, default='00')
#    class_number = models.CharField(max_length=20, default='000')
#    course_number = models.CharField(max_length=10, default=0)
#    professor = models.CharField(max_length=100, null=True, blank=True)  # Professor field is optional, usually updated
 #   section_name = models.CharField(max_length=100, default='D100')  # E.g. D100, E200, etc.
#    semester = models.CharField(
#        max_length=10,
#        choices=Semester.choices,
#        default=Semester.SUMMER
#    )
#    component = models.CharField(
#        max_length=10,
#        choices=Component.choices,
#        default=Component.LECTURE # LECTURE is the default component
#    )
    description = models.TextField(null=True, blank=True)
#    term = models.CharField(max_length=50, null=True, blank = True)
#    delivery_method = models.CharField(max_length=50, null=True, blank=True)
#    start_time = models.CharField(max_length=50, null=True, blank=True)
#    start_date = models.DateField(null=True, blank=True)
#    end_time = models.CharField(max_length=50, null=True, blank=True)
#    end_date = models.DateField(null=True, blank=True)
#    is_exam = models.BooleanField(default=False)
#    days = models.CharField(max_length=50, null=True, blank=True)
#    campus = models.CharField(max_length=50, null=True, blank=True)

    # The __str method below makes the Django Course model readable for when you do print(course)
    def __str__(self):
        #return f"{self.department} {self.course_number} - {self.title} ({self.section_name})"
        return f"{self.department} {self.class_number}"


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
