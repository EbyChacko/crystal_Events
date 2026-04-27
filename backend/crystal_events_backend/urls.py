from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from rest_framework_simplejwt.views import TokenRefreshView
from api.views import CustomTokenObtainPairView, HealthCheckView, EmailTestView

class PublicTokenRefreshView(TokenRefreshView):
    """Token refresh must be open — client sends a refresh token, not a Bearer token."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', HealthCheckView.as_view(), name='health-check'),
    path('api/email-test/', EmailTestView.as_view(), name='email-test'),
    path('api/', include('api.urls')),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', PublicTokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files in all environments (fallback for when Cloudinary upload fails)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
