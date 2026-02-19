from django.contrib import admin
from .models import User, Course, NonLectureSection, LectureSection, NewSemesterNotification, OneTimePassword, Department


admin.site.register(User)
admin.site.register(Course)
admin.site.register(NonLectureSection)
admin.site.register(LectureSection)
admin.site.register(NewSemesterNotification)
admin.site.register(OneTimePassword)
admin.site.register(Department)
admin.site.site_header = 'TransitTail'