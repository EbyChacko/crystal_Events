from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from api.views import CustomTokenObtainPairView, HealthCheckView, EmailTestView

urlpatterns = [
    # Django admin is disabled — all user management goes through the app's own UI.
    # Re-enable only temporarily via a secure, non-guessable path if needed for DB emergencies.
    path('api/health/', HealthCheckView.as_view(), name='health-check'),
    path('api/email-test/', EmailTestView.as_view(), name='email-test'),
    path('api/', include('api.urls')),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files in all environments (fallback for when Cloudinary upload fails)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
