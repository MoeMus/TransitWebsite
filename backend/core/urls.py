"""
This core/urls.py file handles the URLs specific to the core app, including user management,
course management, and fetching course data from the SFU REST API.
"""

from django.urls import path

from . import views
from .views import *

# New view which fetches course data
urlpatterns = [
    path('test/', test_view, name='test-view'),
    path('logout/', logout, name='logout'),
    path('user/', views.UserView.as_view(), name='user'),
    path('user/<str:username>/courses/', views.UserCoursesView.as_view(), name='all-user-courses'),
    path('user/courses/add/', views.add_course_to_schedule, name='add-course'),
    path('user/courses/remove/', views.remove_course_from_schedule, name='remove-course'),
    path('courses/get/all/', fetch_all_courses, name='fetch-all-courses'),
    path('courses/get/', get_courses_from_ids, name='fetch-courses-from-ids'),
    path('courses/<int:course_id>/lectures/', views.GetLectureSectionsView.as_view(), name='get-lecture-sections'),
    path('courses/lectures/<int:lecture_section_id>/non-lectures/', views.GetNonLectureSectionsView.as_view(),
         name='get-non-lecture-sections'),
    path('cookie/approve/', views.ApproveCookieView.as_view(), name='approve-cookie'),
    path('cookie/set/', views.SetCookieView.as_view(), name='set-cookie'),
    path('cookie/get/info/', views.CookieGetUserInfoView.as_view(), name='get-cookie-info'),
    path('cookie/delete/', views.DeleteCookieView.as_view(), name='delete-cookie'),
]
