"""
This core/urls.py file handles the URLs specific to the core app, including user management,
course management, and fetching course data from the SFU REST API.
"""

from django.urls import path
from . import views

# New view which fetches course data
urlpatterns = [
    path('courseschedules/', views.CourseScheduleListCreate.as_view(), name='course-schedule-list-create'),
    path('fetch-course/<int:year>/<str:term>/<str:department>/<str:course_number>/<str:course_section>/',
         views.FetchCourseData.as_view(), name='fetch-course-data'),
]
