"""api URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
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
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.middleware.csrf import get_token

# View to obtain CSRF token for API clients
@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({'csrfToken': token})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('example.urls')),
    path('api/auth/', include('users.urls')),
    path('api/channels/', include('candidates.urls')),
    path('api/auth/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    path("_allauth/", include("allauth.headless.urls")),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/csrf-token/', get_csrf_token, name='csrf_token'),  # Endpoint to get CSRF token
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
