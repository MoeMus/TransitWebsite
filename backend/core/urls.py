"""
This core/urls.py file handles the URLs specific to the core app, including user management,
course management, and fetching course data from the SFU REST API.
"""

from django.urls import path
from views import *

# New view which fetches course data
urlpatterns = [
    path('create_user/', create_new_user, name='create-user'),
    path('test/', test_view, name='test-view'),
    path('delete_user/<int:pk>/', delete_user, name='delete-user'),
    path('delete_all_courses/<int:pk>/', delete_all_courses, name='delete-all-courses'),
    path('add_course/<int:pk1>/', add_course_to_user, name='add-course-to-user'),
    path('remove_course/<int:pk1>/<int:pk2>/', remove_course, name='remove-course'),
    path('courses/', get_all_courses_with_key_word, name='get-all-courses-with-keyword'),
]
