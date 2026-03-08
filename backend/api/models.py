from django.db import models
from django.conf import settings

class Service(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
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
    event_date = models.DateTimeField()
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enquiry')
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

    class Meta:
        ordering = ['-event_date']

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
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    receipt_image = models.ImageField(upload_to='expenses/', blank=True, null=True)
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
        return sum(item.quoted_amount for item in self.items.all()) + self.travel_cost

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
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unread')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name} - {self.status}"


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    designation = models.CharField(max_length=100, blank=True, default='')
    can_view_financials = models.BooleanField(default=False)

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
