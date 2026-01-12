from django.contrib import admin
from .models import User, Course, NonLectureSection, LectureSection, NewSemesterNotification, OneTimePassword


admin.site.register(User)
admin.site.register(Course)
admin.site.register(NonLectureSection)
admin.site.register(LectureSection)
admin.site.register(NewSemesterNotification)
admin.site.register(OneTimePassword)