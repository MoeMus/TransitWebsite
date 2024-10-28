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
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('user/get/', views.UserView.as_view(), name='get-user'),
    path('user/register/', views.RegisterView.as_view(), name='register'),
    path('user/delete/', views.DeleteUserView.as_view(), name='delete-user'),
    path('user/courses/delete/all/', views.DeleteAllCoursesView.as_view(), name='delete-all-courses'),
    path('user/courses/add/', views.AddCourseView.as_view(), name='add-course'),
    path('user/courses/delete/', views.DeleteCourseView.as_view(), name='delete-a-course'),
    path('user/courses/get/', views.GetCourseView.as_view(), name='get-course'),
    path('user/courses/get/all/', views.GetCourseView.as_view(), name='add-course'),
    path('courses/', fetch_all_courses, name='fetch-all-courses'),
]
