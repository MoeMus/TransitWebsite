"""
URL configuration for server project.

The `urlpatterns` list routes URLs to api_endpoints. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function api_endpoints
    1. Add an import:  from my_app import api_endpoints
    2. Add a URL to urlpatterns:  path('', api_endpoints.home, name='home')
Class-based api_endpoints
    1. Add an import:  from other_app.api_endpoints import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))

This server/urls.py file routes high-level/project-level URLs to the appropriate app-level URL configurations.
It includes the URLs for the admin interface and the core app.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt import views as jwt_views

## ONLY IF WE'RE USING SIMPLEJWT FOR AUTHENTICATION
# If you're getting unresolved reference 'rest_framework_simplejwt', do the following in your terminal:
# pip3 install --upgrade djangorestframework-simplejwt
#from rest_framework_simplejwt.api_endpoints import TokenObtainPairView, TokenRefreshView
##

urlpatterns = [
    path('token/', jwt_views.TokenObtainPairView.as_view(), name ='token_obtain_pair'),
    path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name ='token_refresh'),
    path("admin/", admin.site.urls),
    path('api/', include('core.urls')),
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), Only if using simplejwt
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), Only if using simplejwt
]
