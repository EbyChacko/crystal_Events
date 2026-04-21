from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet, EventViewSet, ExpenseViewSet, IncomeViewSet, QuoteViewSet, MessageViewSet,
    CurrentUserView, UserListView, CreateUserView, UpdateProfileView, AdminUserDetailView,
    EventImageViewSet, TeamMemberViewSet, TravelRateViewSet,
    TwoFactorLoginView, TwoFactorSetupView, TwoFactorVerifySetupView, TwoFactorDisableView,
    FoodMenuViewSet, ProfitDistributionView, StaffPickerView, SplitProfitView,
    TipDistributionView, SplitTipView,
    PasswordResetRequestView, PasswordResetConfirmView,
)

router = DefaultRouter()
router.register(r'services', ServiceViewSet)
router.register(r'events', EventViewSet)
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'incomes', IncomeViewSet)
router.register(r'quotes', QuoteViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'event-images', EventImageViewSet)
router.register(r'team-members', TeamMemberViewSet)
router.register(r'travel_rates', TravelRateViewSet)
router.register(r'food-menus', FoodMenuViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('auth/profile/', UpdateProfileView.as_view(), name='update-profile'),
    path('auth/users/', UserListView.as_view(), name='user-list'),
    path('auth/staff/', StaffPickerView.as_view(), name='staff-picker'),
    path('auth/users/create/', CreateUserView.as_view(), name='user-create'),
    path('auth/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('auth/2fa/login/', TwoFactorLoginView.as_view(), name='two-factor-login'),
    path('auth/2fa/setup/', TwoFactorSetupView.as_view(), name='two-factor-setup'),
    path('auth/2fa/verify-setup/', TwoFactorVerifySetupView.as_view(), name='two-factor-verify-setup'),
    path('auth/2fa/disable/', TwoFactorDisableView.as_view(), name='two-factor-disable'),
    path('financials/profit-distribution/', ProfitDistributionView.as_view(), name='profit-distribution'),
    path('financials/split-profit/', SplitProfitView.as_view(), name='split-profit'),
    path('financials/tip-distribution/', TipDistributionView.as_view(), name='tip-distribution'),
    path('financials/split-tip/', SplitTipView.as_view(), name='split-tip'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]

