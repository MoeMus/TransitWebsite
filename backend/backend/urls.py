"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))

This backend/urls.py file routes high-level/project-level URLs to the appropriate app-level URL configurations.
It includes the URLs for the admin interface and the core app.
"""
from django.contrib import admin
from django.urls import path, include
## ONLY IF WE'RE USING SIMPLEJWT FOR AUTHENTICATION
# If you're getting unresolved reference 'rest_framework_simplejwt', do the following in your terminal:
# pip3 install --upgrade djangorestframework-simplejwt
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
##

from core import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/', include('core.urls')),
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), Only if using simplejwt
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), Only if using simplejwt
]
