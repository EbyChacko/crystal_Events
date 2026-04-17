import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.exceptions import ObjectDoesNotExist
from .models import Service, Event, Expense, Income, Quote, QuoteItem, Message, UserProfile, EventImage, TeamMember, TravelRate, FoodMenu, FoodMenuItem


def _sign_cloudinary_pdf_url(url):
    """Return a signed Cloudinary URL for PDF resources.

    This Cloudinary account has Strict Transformations enabled, which
    blocks unsigned delivery of PDFs (both raw/upload and image/upload
    with .pdf format).  Signing with the API secret bypasses the
    restriction.  Falls back to the original URL if signing fails.
    """
    if not url or 'res.cloudinary.com' not in url:
        return url
    # Only sign PDF URLs (raw type always, image type only for .pdf)
    is_raw = '/raw/upload/' in url
    is_image_pdf = '/image/upload/' in url and url.lower().endswith('.pdf')
    if not is_raw and not is_image_pdf:
        return url
    try:
        from django.conf import settings as django_settings
        import cloudinary
        import cloudinary.utils

        cfg = getattr(django_settings, 'CLOUDINARY_STORAGE', {})
        cloudinary.config(
            cloud_name=cfg.get('CLOUD_NAME', ''),
            api_key=cfg.get('API_KEY', ''),
            api_secret=cfg.get('API_SECRET', ''),
            secure=True,
        )
        if is_raw:
            # raw public_id INCLUDES the extension: "folder/file.pdf"
            match = re.search(r'/raw/upload/(?:(v\d+)/)?(.+)$', url)
            if not match:
                return url
            resource_type = 'raw'
            public_id = match.group(2)
            extra = {}
            if match.group(1):
                extra['version'] = match.group(1)[1:]
        else:
            # image public_id EXCLUDES the extension; format is separate
            match = re.search(r'/image/upload/(?:(v\d+)/)?(.+)\.pdf$', url, re.IGNORECASE)
            if not match:
                return url
            resource_type = 'image'
            public_id = match.group(2)
            extra = {'format': 'pdf'}
            if match.group(1):
                extra['version'] = match.group(1)[1:]

        signed_url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            type='upload',
            sign_url=True,
            **extra,
        )
        return signed_url or url
    except Exception:
        return url


def _get_profile_picture_url(profile, request=None):
    """Return the best available profile picture URL (Cloudinary first, then local)."""
    if profile.profile_picture_url:
        return profile.profile_picture_url
    if profile.profile_picture:
        if request:
            return request.build_absolute_uri(profile.profile_picture.url)
        return profile.profile_picture.url
    return None


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'audit_log', 'created_by']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_images(self, obj):
        # Pass request context so image URLs are fully qualified
        return EventImageSerializer(obj.images.all(), many=True, context=self.context).data


class EventImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventImage
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    event_name = serializers.CharField(source='event.event_name', read_only=True, default=None)
    approved_by_name = serializers.SerializerMethodField()
    paid_by_name = serializers.SerializerMethodField()
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = '__all__'

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None

    def get_paid_by_name(self, obj):
        if obj.paid_by:
            return f"{obj.paid_by.first_name} {obj.paid_by.last_name}".strip() or obj.paid_by.username
        return None

    def get_receipt_url(self, obj):
        if obj.receipt_image_url:
            return _sign_cloudinary_pdf_url(obj.receipt_image_url)
        if obj.receipt_image:
            url = obj.receipt_image.url
            if url.startswith('http'):
                return _sign_cloudinary_pdf_url(url)
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
        return None

class IncomeSerializer(serializers.ModelSerializer):
    paid_by_name = serializers.SerializerMethodField()
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = Income
        fields = '__all__'

    def get_paid_by_name(self, obj):
        if obj.paid_by:
            return f"{obj.paid_by.first_name} {obj.paid_by.last_name}".strip() or obj.paid_by.username
        return None

    def get_receipt_url(self, obj):
        if obj.receipt_image_url:
            return _sign_cloudinary_pdf_url(obj.receipt_image_url)
        if obj.receipt_image:
            url = obj.receipt_image.url
            if url.startswith('http'):
                return _sign_cloudinary_pdf_url(url)
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
        return None

class TravelRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelRate
        fields = '__all__'

class QuoteItemSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = QuoteItem
        fields = ['id', 'service', 'service_name', 'minimum_amount', 'quoted_amount', 'comment']


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    event_name = serializers.CharField(source='event.event_name', read_only=True, default=None)

    class Meta:
        model = Quote
        fields = [
            'id', 'event', 'event_name',
            'client_name', 'client_email', 'client_phone', 'client_address',
            'travel_cost', 'catering_cost', 'discount_percentage', 'status', 'notes', 'special_requirements',
            'created_at', 'updated_at',
            'items', 'subtotal', 'discount_amount', 'total',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        quote = Quote.objects.create(**validated_data)
        for item_data in items_data:
            QuoteItem.objects.create(quote=quote, **item_data)
        return quote

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuoteItem.objects.create(quote=instance, **item_data)
        return instance

class MessageSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'name', 'email', 'phone', 'message', 'service', 'service_name', 'status', 'reply_text', 'replies', 'replied_at', 'created_at']
        read_only_fields = ['created_at', 'replied_at']


# ── User & Profile Serializers ─────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['profile_picture', 'phone', 'address', 'designation', 'can_view_financials',
                  'email_notifications', 'notify_new_event', 'notify_quote_accepted',
                  'notify_weekly_report', 'notify_daily_summary']


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    phone = serializers.CharField(source='profile.phone', read_only=True)
    address = serializers.CharField(source='profile.address', read_only=True)
    designation = serializers.CharField(source='profile.designation', read_only=True)
    can_view_financials = serializers.BooleanField(source='profile.can_view_financials', read_only=True)
    is_owner = serializers.BooleanField(source='profile.is_owner', read_only=True)
    profit_percentage = serializers.DecimalField(source='profile.profit_percentage', max_digits=5, decimal_places=2, read_only=True)
    email_notifications = serializers.BooleanField(source='profile.email_notifications', read_only=True)
    notify_new_event = serializers.BooleanField(source='profile.notify_new_event', read_only=True)
    notify_quote_accepted = serializers.BooleanField(source='profile.notify_quote_accepted', read_only=True)
    notify_weekly_report = serializers.BooleanField(source='profile.notify_weekly_report', read_only=True)
    notify_daily_summary = serializers.BooleanField(source='profile.notify_daily_summary', read_only=True)
    two_factor_enabled = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_staff', 'is_superuser', 'is_active', 'date_joined',
            'profile_picture', 'phone', 'address', 'designation', 'can_view_financials',
            'is_owner', 'profit_percentage',
            'email_notifications', 'notify_new_event', 'notify_quote_accepted',
            'notify_weekly_report', 'notify_daily_summary', 'two_factor_enabled'
        ]
        read_only_fields = fields

    def get_two_factor_enabled(self, obj):
        try:
            return obj.two_factor_auth.is_enabled
        except ObjectDoesNotExist:
            return False

    def get_profile_picture(self, obj):
        """Return profile picture URL — Cloudinary URL takes priority over local file."""
        if hasattr(obj, 'profile'):
            return _get_profile_picture_url(obj.profile, self.context.get('request'))
        return None


class TeamMemberSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'user_details', 'description', 'order', 'created_at']
        read_only_fields = ['created_at']

    def get_user_details(self, obj):
        user = obj.user
        profile_pic_url = _get_profile_picture_url(user.profile, self.context.get('request')) if hasattr(user, 'profile') else None
        return {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'designation': getattr(user, 'profile', None).designation if hasattr(user, 'profile') else '',
            'profile_picture': profile_pic_url,
        }

class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10)
    profile_picture = serializers.ImageField(required=False, write_only=True)
    is_staff = serializers.BooleanField(required=False, default=True)
    is_superuser = serializers.BooleanField(required=False, default=False)
    designation = serializers.CharField(required=False, default='', allow_blank=True, max_length=100)
    phone = serializers.CharField(required=False, default='', allow_blank=True, max_length=20)
    address = serializers.CharField(required=False, default='', allow_blank=True, max_length=500)
    can_view_financials = serializers.BooleanField(required=False, default=False)
    is_owner = serializers.BooleanField(required=False, default=False)
    profit_percentage = serializers.DecimalField(required=False, default=0, max_digits=5, decimal_places=2)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'profile_picture', 'is_staff', 'is_superuser', 'designation', 'phone', 'address', 'can_view_financials', 'is_owner', 'profit_percentage']

    def create(self, validated_data):
        profile_picture = validated_data.pop('profile_picture', None)
        is_staff = validated_data.pop('is_staff', True)
        is_superuser = validated_data.pop('is_superuser', False)
        designation = validated_data.pop('designation', '')
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        can_view_financials = validated_data.pop('can_view_financials', False)
        is_owner = validated_data.pop('is_owner', False)
        profit_percentage = validated_data.pop('profit_percentage', 0)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            is_staff=is_staff,
            is_superuser=is_superuser,
        )
        profile = user.profile
        profile.designation = designation
        profile.phone = phone
        profile.address = address
        profile.can_view_financials = can_view_financials
        profile.is_owner = is_owner
        profile.profit_percentage = profit_percentage
        if profile_picture:
            profile.profile_picture = profile_picture
        profile.save()
        return user


class UpdateProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(source='profile.profile_picture', required=False)
    phone = serializers.CharField(source='profile.phone', required=False, allow_blank=True, max_length=20)
    address = serializers.CharField(source='profile.address', required=False, allow_blank=True, max_length=500)
    designation = serializers.CharField(source='profile.designation', required=False, allow_blank=True, max_length=100)
    email_notifications = serializers.BooleanField(source='profile.email_notifications', required=False)
    notify_new_event = serializers.BooleanField(source='profile.notify_new_event', required=False)
    notify_quote_accepted = serializers.BooleanField(source='profile.notify_quote_accepted', required=False)
    notify_weekly_report = serializers.BooleanField(source='profile.notify_weekly_report', required=False)
    notify_daily_summary = serializers.BooleanField(source='profile.notify_daily_summary', required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=10)
    old_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'password', 'old_password', 'profile_picture',
                  'phone', 'address', 'designation', 'email_notifications',
                  'notify_new_event', 'notify_quote_accepted', 'notify_weekly_report', 'notify_daily_summary']

    def validate(self, attrs):
        """If a new password is being set, old_password must be provided and correct."""
        password = attrs.get('password')
        old_password = attrs.get('old_password')

        if password:
            if not old_password:
                raise serializers.ValidationError({'old_password': 'Current password is required to set a new password.'})
            user = self.instance
            if not user.check_password(old_password):
                raise serializers.ValidationError({'old_password': 'Current password is incorrect.'})

        return attrs

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        validated_data.pop('old_password', None)  # Remove before setting attrs

        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()

        # Update Profile fields
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        if 'profile_picture' in profile_data:
            profile.profile_picture = profile_data['profile_picture']
        if 'phone' in profile_data:
            profile.phone = profile_data['phone']
        if 'address' in profile_data:
            profile.address = profile_data['address']
        if 'designation' in profile_data:
            profile.designation = profile_data['designation']
        if 'email_notifications' in profile_data:
            profile.email_notifications = profile_data['email_notifications']
        if 'notify_new_event' in profile_data:
            profile.notify_new_event = profile_data['notify_new_event']
        if 'notify_quote_accepted' in profile_data:
            profile.notify_quote_accepted = profile_data['notify_quote_accepted']
        if 'notify_weekly_report' in profile_data:
            profile.notify_weekly_report = profile_data['notify_weekly_report']
        if 'notify_daily_summary' in profile_data:
            profile.notify_daily_summary = profile_data['notify_daily_summary']
        profile.save()

        return instance


class AdminUpdateUserSerializer(serializers.ModelSerializer):
    """Allows a superuser to edit any user's details and toggle access."""
    profile_picture = serializers.ImageField(source='profile.profile_picture', required=False)
    phone = serializers.CharField(source='profile.phone', required=False, allow_blank=True, max_length=20)
    address = serializers.CharField(source='profile.address', required=False, allow_blank=True, max_length=500)
    designation = serializers.CharField(source='profile.designation', required=False, allow_blank=True, max_length=100)
    can_view_financials = serializers.BooleanField(source='profile.can_view_financials', required=False)
    is_owner = serializers.BooleanField(source='profile.is_owner', required=False)
    profit_percentage = serializers.DecimalField(source='profile.profit_percentage', max_digits=5, decimal_places=2, required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=10)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'username', 'email',
            'is_active', 'is_staff', 'is_superuser',
            'password', 'profile_picture', 'phone', 'address', 'designation', 'can_view_financials',
            'is_owner', 'profit_percentage'
        ]

    def validate(self, attrs):
        """Prevent a super admin from removing their own access privileges."""
        request = self.context.get('request')
        if request and self.instance and request.user == self.instance:
            errors = {}
            if 'is_superuser' in attrs and not attrs['is_superuser']:
                errors['is_superuser'] = 'You cannot remove your own Super Admin privileges.'
            if 'is_staff' in attrs and not attrs['is_staff']:
                errors['is_staff'] = 'You cannot remove your own admin panel access.'
            if 'is_active' in attrs and not attrs['is_active']:
                errors['is_active'] = 'You cannot deactivate your own account.'
            if errors:
                raise serializers.ValidationError(errors)
        return attrs

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()

        profile, _ = UserProfile.objects.get_or_create(user=instance)
        if 'profile_picture' in profile_data:
            profile.profile_picture = profile_data['profile_picture']
        if 'phone' in profile_data:
            profile.phone = profile_data['phone']
        if 'address' in profile_data:
            profile.address = profile_data['address']
        if 'designation' in profile_data:
            profile.designation = profile_data['designation']
        if 'can_view_financials' in profile_data:
            profile.can_view_financials = profile_data['can_view_financials']
        if 'is_owner' in profile_data:
            profile.is_owner = profile_data['is_owner']
        if 'profit_percentage' in profile_data:
            profile.profit_percentage = profile_data['profit_percentage']
        profile.save()

        return instance

# ── Two-Factor Authentication Serializers ──────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        # Check if 2FA is enabled
        if hasattr(user, 'two_factor_auth') and user.two_factor_auth.is_enabled:
            return {
                '2fa_required': True,
                'user_id': user.id
            }
        
        return data

class TwoFactorLoginSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate(self, attrs):
        user_id = attrs.get('user_id')
        otp = attrs.get('otp')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({'error': 'Invalid login credentials.'})

        if not hasattr(user, 'two_factor_auth') or not user.two_factor_auth.is_enabled:
            raise serializers.ValidationError({'error': '2FA is not enabled for this account.'})

        import pyotp
        totp = pyotp.TOTP(user.two_factor_auth.secret_key)
        
        # Valid window 2 gives up to 1 minute tolerance for clock drift
        if not totp.verify(str(otp).strip(), valid_window=2):
            raise serializers.ValidationError({'error': 'Invalid or expired OTP code. Please try again.'})

        # OTP is valid, issue standard JWT tokens
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }


class FoodMenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodMenuItem
        fields = ['id', 'name']

class FoodMenuSerializer(serializers.ModelSerializer):
    items = FoodMenuItemSerializer(many=True)
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    event_name = serializers.CharField(source='event.event_name', read_only=True, default=None)

    class Meta:
        model = FoodMenu
        fields = [
            'id', 'event', 'event_name', 'adult_count', 'adult_rate',
            'kid_count', 'kid_rate', 'items', 'total_cost', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        menu = FoodMenu.objects.create(**validated_data)
        for item_data in items_data:
            FoodMenuItem.objects.create(menu=menu, **item_data)
        return menu

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                FoodMenuItem.objects.create(menu=instance, **item_data)
        return instance
