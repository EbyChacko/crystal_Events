from django.db import models
from django.conf import settings

class Service(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='services/', null=True, blank=True)
    image_url = models.URLField(max_length=1000, blank=True, null=True)
    show_on_website = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Event(models.Model):
    EVENT_TYPE_CHOICES = [
        ('wedding', 'Wedding'),
        ('corporate', 'Corporate'),
        ('birthday', 'Birthday'),
        ('concert', 'Concert'),
        ('conference', 'Conference'),
        ('private_party', 'Private Party'),
        ('charity', 'Charity / Fundraiser'),
        ('festival', 'Festival'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('enquiry', 'Enquiry'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('finished', 'Finished'),
        ('canceled', 'Canceled'),
    ]

    # Event info
    event_name = models.CharField(max_length=255)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES, default='other')
    description = models.TextField(blank=True, default='')
    special_requirements = models.TextField(blank=True, default='')

    # Client info
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField(blank=True, default='')
    client_phone = models.CharField(max_length=30, blank=True, default='')
    client_address = models.TextField(blank=True, default='')

    # Venue & schedule
    event_date = models.DateTimeField(db_index=True)
    end_date = models.DateTimeField(null=True, blank=True)
    hall_available_from = models.DateTimeField(null=True, blank=True)
    venue = models.CharField(max_length=255)
    venue_address = models.TextField(blank=True, default='')

    # Logistics
    guest_count = models.PositiveIntegerField(null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    distance_from_ballinasloe = models.PositiveIntegerField(null=True, blank=True, help_text="Distance in km")
    
    # Payment Fields
    received_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    payment_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Notes
    notes = models.TextField(blank=True, default='')

    # Status & assignment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enquiry', db_index=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_events'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='created_events'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Audit logbook — list of JSON snapshots
    audit_log = models.JSONField(default=list, blank=True)

    # Human-readable unique reference (e.g. CE-00001)
    event_uid = models.CharField(max_length=20, unique=True, blank=True)

    class Meta:
        ordering = ['-event_date']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.event_uid:
            self.event_uid = f'CE-{self.id:05d}'
            type(self).objects.filter(pk=self.pk).update(event_uid=self.event_uid)

    def __str__(self):
        return f"{self.event_name} — {self.client_name}"

class EventImage(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='event_galleries/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True, max_length=500)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.event.event_name}"

class Expense(models.Model):
    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=255)
    category = models.CharField(max_length=100) # e.g. Decor, Catering
    event = models.ForeignKey('Event', on_delete=models.CASCADE, null=True, blank=True, related_name='expenses')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='approved_expenses')
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses_paid')
    paid_back = models.BooleanField(default=False)
    paid_back_at = models.DateTimeField(null=True, blank=True)
    receipt_image = models.FileField(upload_to='expenses/', blank=True, null=True)
    receipt_image_url = models.URLField(max_length=1000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Asset Tracking Fields
    is_asset = models.BooleanField(default=False)
    asset_current_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active_asset = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.date} - {self.reason}"

class Income(models.Model):
    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payer_name = models.CharField(max_length=255, blank=True, default='')
    reason = models.CharField(max_length=255)
    category = models.CharField(max_length=100) # e.g. Investment, Sales, Other
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='added_incomes')
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='incomes_received')
    paid_back = models.BooleanField(default=False)
    paid_back_at = models.DateTimeField(null=True, blank=True)
    receipt_image = models.FileField(upload_to='incomes/', blank=True, null=True)
    receipt_image_url = models.URLField(max_length=1000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} - {self.reason}"

class TwoFactorAuth(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='two_factor_auth')
    secret_key = models.CharField(max_length=32, blank=True, null=True)
    is_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f"2FA Config for {self.user.username}"

class TravelRate(models.Model):
    distance_from = models.PositiveIntegerField(default=0, help_text="Distance from (km)")
    distance_to = models.PositiveIntegerField(default=9999, help_text="Distance to (km)")
    rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Cost for this distance range")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['distance_from', 'distance_to']

    def __str__(self):
        return f"{self.distance_from}km to {self.distance_to}km - €{self.rate}"

class Quote(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    # Link to event (optional — quote can exist standalone or linked)
    event = models.ForeignKey('Event', on_delete=models.CASCADE, null=True, blank=True, related_name='quotes')

    # Client info
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField(blank=True, default='')
    client_phone = models.CharField(max_length=30, blank=True, default='')
    client_address = models.TextField(blank=True, default='')

    # Quote details
    travel_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    catering_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, default='')
    special_requirements = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def subtotal(self):
        return sum(item.quoted_amount for item in self.items.all()) + self.travel_cost + self.catering_cost

    @property
    def discount_amount(self):
        return (self.subtotal * self.discount_percentage / 100).quantize(
            __import__('decimal').Decimal('0.01')
        )

    @property
    def total(self):
        return self.subtotal - self.discount_amount

    def __str__(self):
        return f"Quote #{self.id} — {self.client_name}"


class QuoteItem(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    service = models.ForeignKey(Service, on_delete=models.PROTECT)
    minimum_amount = models.DecimalField(max_digits=10, decimal_places=2)
    quoted_amount = models.DecimalField(max_digits=10, decimal_places=2)
    comment = models.TextField(blank=True, default="")

    def __str__(self):
        return f"{self.service.name} — €{self.quoted_amount}"

class Message(models.Model):
    STATUS_CHOICES = [
        ('unread', 'Unread'),
        ('read', 'Read'),
        ('replied', 'Replied'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, default='')
    message = models.TextField()
    reply_text = models.TextField(blank=True, default='')
    replies = models.JSONField(default=list, blank=True)  # list of {text, sent_at} dicts
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unread', db_index=True)
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name} - {self.status}"


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    profile_picture_url = models.URLField(max_length=1000, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    designation = models.CharField(max_length=100, blank=True, default='')
    can_view_financials = models.BooleanField(default=False)
    is_owner = models.BooleanField(default=False, db_index=True, help_text="Company owner — included in profit distribution")
    profit_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Percentage of net profit allocated to this owner")
    email_notifications = models.BooleanField(default=True, help_text="Receive email when a new contact message is received")
    notify_new_event = models.BooleanField(default=True, help_text="Receive email when a new event is created")
    notify_quote_accepted = models.BooleanField(default=True, help_text="Receive email when a quote is accepted")
    notify_weekly_report = models.BooleanField(default=False, help_text="Receive weekly summary report")
    notify_daily_summary = models.BooleanField(default=False, help_text="Receive daily overview email")

    def __str__(self):
        return f"Profile of {self.user.username}"


# Auto-create UserProfile when a User is created
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

class TeamMember(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_member_profile')
    description = models.TextField(blank=True, default='')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Team Member: {self.user.username}"


class FoodMenu(models.Model):
    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name='food_menu')
    adult_count = models.PositiveIntegerField(default=0)
    adult_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    kid_count = models.PositiveIntegerField(default=0)
    kid_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_cost(self):
        return (self.adult_count * self.adult_rate) + (self.kid_count * self.kid_rate)

    def __str__(self):
        return f"Food Menu for {self.event.event_name}"

class FoodMenuItem(models.Model):
    menu = models.ForeignKey(FoodMenu, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

