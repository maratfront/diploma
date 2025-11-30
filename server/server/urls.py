from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView
)
from rest_framework import permissions
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)
from django.urls import (
    path
)
from apps.user import views

urlpatterns = [
    path(
        'admin/',
        admin.site.urls
    ),
    path(
        'api/token/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),
    path(
        'api/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),
    path(
        "api/register/",
        views.RegisterView.as_view(),
        name="register"
    ),
    path(
        "api/auth/",
        views.AuthView.as_view(),
        name="auth"
    ),
    path(
        "api/user/update/",
        views.UpdateView.as_view(),
        name="user_update"
    ),
    path(
        'api/schema/',
        SpectacularAPIView.as_view(
            permission_classes=[permissions.AllowAny]
        ),
        name='schema'
    ),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(
            url_name='schema',
            permission_classes=[permissions.AllowAny]
        ),
        name='swagger-ui'
    )
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
