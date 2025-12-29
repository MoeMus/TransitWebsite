"""
This core/urls.py file handles the URLs specific to the core app, including user management,
course management, and fetching course data from the SFU REST API.
"""

from django.urls import path

from .views import *

from .api_endpoints import user_views, course_views, cookie_views, translink_views

urlpatterns = [
    path('test/', test_view, name='test-view'),
    path('logout/', logout, name='logout'),
    path('user/', user_views.UserView.as_view(), name='user'),
    path('user/courses/', user_views.get_user_courses, name='all-user-courses'),
    path('user/courses/add/', user_views.add_course_to_schedule, name='add-course'),
    path('user/courses/remove/', user_views.remove_course_from_schedule, name='remove-course'),
    path('user/courses/remove/all/', user_views.remove_courses, name='remove-all-courses'),
    path('user/next-class/', user_views.get_next_class, name='get-next-class'),
    path('user/notification/', user_views.get_new_semester_notification, name='get-new-notification'),
    path('courses/get/all/', course_views.fetch_all_courses, name='fetch-all-courses'),
    path('courses/get/', course_views.get_course, name='fetch-course'),
    path('courses/<int:course_id>/lectures/', course_views.get_lecture_sections, name='get-lecture-sections'),
    path('courses/lectures/<int:lecture_section_id>/non-lectures/', course_views.get_non_lecture_sections,
         name='get-non-lecture-sections'),
    path('cookie/approve/', cookie_views.approve_cookie, name='approve-cookie'),
    path('cookie/set/', cookie_views.set_cookie, name='set-cookie'),
    path('cookie/get/info/', cookie_views.get_user_info_from_cookie, name='get-cookie-info'),
    path('cookie/delete/', cookie_views.delete_cookie, name='delete-cookie'),
    path('translink/alerts/', translink_views.get_service_alerts, name='translink-alerts'),
]
