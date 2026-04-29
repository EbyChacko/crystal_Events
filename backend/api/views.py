import logging
import os
from rest_framework import viewsets, permissions, status, generics, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User

logger = logging.getLogger('api')

ALLOWED_UPLOAD_TYPES = {
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB


def _validate_upload(file_obj):
    """Validate uploaded file type and size. Returns error string or None."""
    if not file_obj:
        return None
    if file_obj.size > MAX_UPLOAD_SIZE:
        return f'File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024*1024)}MB.'
    if hasattr(file_obj, 'content_type') and file_obj.content_type not in ALLOWED_UPLOAD_TYPES:
        return f'File type "{file_obj.content_type}" not allowed. Accepted: JPEG, PNG, WebP, GIF, PDF.'
    return None


def _cloudinary_upload(file_obj, folder='uploads'):
    """Upload a file directly to Cloudinary and return its secure_url.
    Returns None if credentials are missing or the upload fails.
    """
    if not file_obj:
        return None
    cloud_cfg = getattr(settings, 'CLOUDINARY_STORAGE', {})
    cloud_name = cloud_cfg.get('CLOUD_NAME', '')
    api_key    = cloud_cfg.get('API_KEY', '')
    api_secret = cloud_cfg.get('API_SECRET', '')
    if not cloud_name or not api_key or not api_secret:
        logger.warning('Cloudinary not configured — skipping upload for folder "%s".', folder)
        return None
    try:
        import cloudinary
        import cloudinary.uploader
        # Configure the SDK explicitly on every call (cheap, idempotent)
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True,
        )
        # DRF's ImageField.to_internal_value() reads the file during validation,
        # so we must reset the pointer before passing it to Cloudinary.
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
        result = cloudinary.uploader.upload(
            file_obj,
            folder=f'crystal_events/{folder}',
            resource_type='auto',
            use_filename=True,
            unique_filename=True,
        )
        url = result.get('secure_url')
        logger.info('Cloudinary upload OK (%s).', folder)
        return url
    except Exception as exc:
        logger.error('Cloudinary upload fatal error (%s): %s', folder, exc)
        return None
from .serializers import (
    ServiceSerializer, EventSerializer, ExpenseSerializer, IncomeSerializer,
    QuoteSerializer, MessageSerializer, UserSerializer,
    CreateUserSerializer, UpdateProfileSerializer, AdminUpdateUserSerializer,
    EventImageSerializer, TeamMemberSerializer, TravelRateSerializer,
    TwoFactorLoginSerializer, CustomTokenObtainPairSerializer,
    AssetSerializer, FoodMenuSerializer, PublicEventSerializer
)
from .models import Service, Event, Expense, Income, Quote, Message, EventImage, TeamMember, TravelRate, TwoFactorAuth, FoodMenu, FoodMenuItem, UserProfile, Asset


class HealthCheckView(APIView):
    """Lightweight wake-up endpoint. No auth, no DB query."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class EmailTestView(APIView):
    """Superuser-only endpoint to diagnose email configuration on the server."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        brevo_api_key = getattr(settings, 'BREVO_API_KEY', None)

        if brevo_api_key:
            # Brevo HTTP API mode
            result = {
                "config": {
                    "EMAIL_BACKEND": "anymail.backends.brevo.EmailBackend",
                    "BREVO_API_KEY_SET": True,
                    "DEFAULT_FROM_EMAIL": settings.DEFAULT_FROM_EMAIL,
                }
            }
            import requests as req
            try:
                resp = req.get(
                    "https://api.brevo.com/v3/account",
                    headers={"api-key": brevo_api_key},
                    timeout=10,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    result["brevo_api"] = "OK"
                    result["brevo_account"] = data.get("email", "")
                else:
                    result["brevo_api_error"] = f"HTTP {resp.status_code}: {resp.text}"
            except Exception as e:
                result["brevo_api_error"] = f"{type(e).__name__}: {e}"
        else:
            import smtplib, ssl as ssl_lib
            result = {
                "config": {
                    "EMAIL_HOST": settings.EMAIL_HOST,
                    "EMAIL_PORT": settings.EMAIL_PORT,
                    "EMAIL_HOST_USER": settings.EMAIL_HOST_USER,
                    "EMAIL_HOST_PASSWORD_SET": bool(settings.EMAIL_HOST_PASSWORD),
                    "EMAIL_USE_SSL": settings.EMAIL_USE_SSL,
                    "EMAIL_USE_TLS": settings.EMAIL_USE_TLS,
                    "DEFAULT_FROM_EMAIL": settings.DEFAULT_FROM_EMAIL,
                }
            }
            try:
                ctx = ssl_lib.create_default_context()
                with smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT, context=ctx, timeout=10) as s:
                    result["smtp_connect"] = "OK"
                    s.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
                    result["smtp_auth"] = "OK"
            except Exception as e:
                result["smtp_error"] = f"{type(e).__name__}: {e}"

        return Response(result)


class IsSuperUser(permissions.BasePermission):
    """Only allows access to superusers."""
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser


class IsStaffOrFinancials(permissions.BasePermission):
    """Allows access to superusers, staff, or users with can_view_financials."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_staff:
            return True
        return bool(getattr(getattr(request.user, 'profile', None), 'can_view_financials', False))


class IsStaffOrAssets(permissions.BasePermission):
    """Allows access to superusers or users with can_manage_assets (view) or can_add_asset (write)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return bool(getattr(profile, 'can_manage_assets', False) or getattr(profile, 'can_add_asset', False))
        return bool(getattr(profile, 'can_add_asset', False))


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsSuperUser()]

    def _save_with_image(self, serializer, **kwargs):
        file = self.request.FILES.get('image')
        err = _validate_upload(file)
        if err:
            raise serializers.ValidationError({'image': err})
        url = _cloudinary_upload(file, 'services')
        if url:
            return serializer.save(image=None, image_url=url, **kwargs)
        return serializer.save(**kwargs)

    def perform_create(self, serializer):
        self._save_with_image(serializer)

    def perform_update(self, serializer):
        self._save_with_image(serializer)

class TravelRateViewSet(viewsets.ModelViewSet):
    queryset = TravelRate.objects.all()
    serializer_class = TravelRateSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsSuperUser()]

class IncomeViewSet(viewsets.ModelViewSet):
    queryset = Income.objects.select_related('paid_by', 'added_by').all()
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrFinancials]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Income.objects.select_related('paid_by', 'added_by').all()
        paid_by = self.request.query_params.get('paid_by')
        if paid_by:
            queryset = queryset.filter(paid_by=paid_by)
        return queryset

    def _save_with_image(self, serializer, **kwargs):
        file = self.request.FILES.get('receipt_image')
        err = _validate_upload(file)
        if err:
            raise serializers.ValidationError({'receipt_image': err})
        url = _cloudinary_upload(file, 'incomes')
        if url:
            return serializer.save(receipt_image=None, receipt_image_url=url, **kwargs)
        return serializer.save(**kwargs)

    def perform_create(self, serializer):
        self._save_with_image(serializer, added_by=self.request.user)

    def perform_update(self, serializer):
        self._save_with_image(serializer)

    @action(detail=False, methods=['post'], url_path='bulk_mark_paid_back')
    def bulk_mark_paid_back(self, request):
        from django.utils import timezone
        ids = request.data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({'error': 'No ids provided.'}, status=400)
        if len(ids) > 100:
            return Response({'error': 'Maximum 100 items per request.'}, status=400)
        try:
            safe_ids = [int(i) for i in ids]
        except (ValueError, TypeError):
            return Response({'error': 'Invalid ID format.'}, status=400)
        Income.objects.filter(id__in=safe_ids).update(paid_back=True, paid_back_at=timezone.now())
        return Response({'updated': len(safe_ids)})

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related('assigned_to', 'created_by').prefetch_related('images').all()
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve'] and not self.request.user.is_authenticated:
            return PublicEventSerializer
        return EventSerializer

    def get_queryset(self):
        from django.utils import timezone
        qs = super().get_queryset()
        # Auto-update status to in_progress if event_date has passed
        Event.objects.filter(status='confirmed', event_date__lte=timezone.now()).update(status='in_progress')
        # Unauthenticated requests (public gallery) — only events that have images
        if not self.request.user.is_authenticated:
            qs = qs.filter(images__isnull=False).distinct()
        return qs

    def _build_snapshot(self, event):
        """Build a dict snapshot of the current event state for the audit log."""
        return {
            'event_name': event.event_name,
            'event_type': event.event_type,
            'description': event.description,
            'special_requirements': event.special_requirements,
            'client_name': event.client_name,
            'client_email': event.client_email,
            'client_phone': event.client_phone,
            'client_address': event.client_address,
            'event_date': event.event_date.isoformat() if event.event_date else None,
            'end_date': event.end_date.isoformat() if event.end_date else None,
            'hall_available_from': event.hall_available_from.isoformat() if event.hall_available_from else None,
            'venue': event.venue,
            'venue_address': event.venue_address,
            'guest_count': event.guest_count,
            'distance_from_ballinasloe': event.distance_from_ballinasloe,
            'budget': str(event.budget) if event.budget else None,
            'notes': event.notes,
            'received_amount': str(event.received_amount) if getattr(event, 'received_amount', None) is not None else None,
            'payment_discount': str(event.payment_discount) if getattr(event, 'payment_discount', None) is not None else None,
            'status': event.status,
            'assigned_to': event.assigned_to_id,
            'assigned_to_name': (
                f"{event.assigned_to.first_name} {event.assigned_to.last_name}".strip()
                if event.assigned_to else None
            ),
        }

    def _user_display(self, user):
        name = f"{user.first_name} {user.last_name}".strip()
        return name if name else user.username

    def perform_create(self, serializer):
        user = self.request.user
        event = serializer.save(created_by=user)
        # Initial audit log entry
        event.audit_log = [{
            'timestamp': event.created_at.isoformat(),
            'action': 'created',
            'user': self._user_display(user),
            'snapshot': self._build_snapshot(event),
        }]
        event.save(update_fields=['audit_log'])

        # Send Booking Confirmation if created as confirmed
        if event.status == 'confirmed' and event.client_email:
            try:
                from django.core.mail import send_mail
                send_mail(
                    subject="Booking Confirmation",
                    message="Thank you for booking with Crystal Events!",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[event.client_email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error('Error sending booking confirmation: %s', e)

        # Notify staff about new event
        try:
            from django.core.mail import EmailMultiAlternatives
            event_date_str = event.event_date.strftime('%d %B %Y at %H:%M') if event.event_date else 'TBC'
            recipients = [settings.NOTIFY_EMAIL]
            for profile in UserProfile.objects.select_related('user').filter(notify_new_event=True, user__is_active=True):
                if profile.user.email and profile.user.email not in recipients:
                    recipients.append(profile.user.email)
            plain = (
                f"New event created: {event.event_name}\n"
                f"Client: {event.client_name}\n"
                f"Date: {event_date_str}\n"
                f"Venue: {event.venue}\n"
                f"Status: {event.get_status_display()}\n"
                f"Created by: {self._user_display(user)}"
            )
            html = f"""
<html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">
<div style="background:#1a3a3a;padding:24px 28px;">
  <h2 style="color:#c5a059;margin:0;font-size:20px;">New Event Created</h2>
</div>
<div style="padding:24px 28px;">
  <p style="font-size:15px;color:#333;"><strong>{event.event_name}</strong></p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;color:#555;">
    <tr><td style="padding:6px 0;width:120px;color:#888;">Client</td><td>{event.client_name}</td></tr>
    <tr><td style="padding:6px 0;color:#888;">Date</td><td>{event_date_str}</td></tr>
    <tr><td style="padding:6px 0;color:#888;">Venue</td><td>{event.venue}</td></tr>
    <tr><td style="padding:6px 0;color:#888;">Status</td><td>{event.get_status_display()}</td></tr>
    <tr><td style="padding:6px 0;color:#888;">Created by</td><td>{self._user_display(user)}</td></tr>
  </table>
</div>
<div style="background:#f9f9f9;padding:14px 28px;font-size:12px;color:#aaa;">Crystal Events Admin</div>
</div></body></html>"""
            msg = EmailMultiAlternatives(
                subject=f'New Event: {event.event_name}',
                body=plain,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipients,
            )
            msg.attach_alternative(html, 'text/html')
            msg.send(fail_silently=True)
        except Exception as e:
            logger.error('Error sending new event notification: %s', e)

    def perform_update(self, serializer):
        user = self.request.user
        
        # Capture old state entirely for diffing
        old_instance = serializer.instance
        old_snapshot = self._build_snapshot(old_instance)
        
        old_received = old_instance.received_amount or 0
        old_discount = old_instance.payment_discount or 0
        old_tip = old_instance.tip_amount or 0

        event = serializer.save()

        new_received = event.received_amount or 0
        new_discount = event.payment_discount or 0
        new_tip = event.tip_amount or 0

        current_log = list(event.audit_log or [])

        # Check if this was purely a payment update (to separate payment logs from data updates)
        if new_received > old_received or new_discount > old_discount or new_tip > old_tip:
            amount_now = new_received - old_received
            tip_now = new_tip - old_tip
            budget = event.budget or 0
            discount = event.payment_discount or 0
            remaining = budget - new_received - discount

            quote_snapshot = []
            quote_to_use = event.quotes.filter(status='accepted').first() or event.quotes.order_by('-created_at').first()
            if quote_to_use and quote_to_use.items.exists():
                for item in quote_to_use.items.all():
                    quote_snapshot.append({
                        'service_name': item.service.name,
                        'comment': item.comment,
                        'quoted_amount': str(item.quoted_amount)
                    })
                travel_cost = float(quote_to_use.travel_cost) if getattr(quote_to_use, 'travel_cost', 0) else 0.0
                if travel_cost > 0:
                    quote_snapshot.append({
                        'service_name': 'Travel Expense',
                        'comment': '',
                        'quoted_amount': str(travel_cost)
                    })

            tip_only = (amount_now == 0 and new_discount == old_discount and tip_now > 0)
            log_entry = {
                'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
                'action': 'tip_received' if tip_only else 'payment_received',
                'user': self._user_display(user),
                'amount_received_now': str(amount_now),
                'total_amount_received': str(new_received),
                'quoted_amount': str(budget),
                'discount': str(discount),
                'remaining_balance': str(remaining),
                'quote_items_snapshot': quote_snapshot,
            }
            if tip_now > 0:
                log_entry['tip_received_now'] = str(tip_now)
                log_entry['total_tip_amount'] = str(new_tip)
            current_log.append(log_entry)
        else:
            # Snapshot the NEW state and diff against old to see what actually changed
            new_snapshot = self._build_snapshot(event)
            changes = {}
            
            for key, new_val in new_snapshot.items():
                old_val = old_snapshot.get(key)
                if old_val != new_val:
                    changes[key] = {
                        'old': old_val,
                        'new': new_val
                    }
            
            # If nothing meaningful changed, don't pollute the logbook
            if changes:
                log_entry = {
                    'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
                    'action': 'updated',
                    'user': self._user_display(user),
                    'changes': changes,
                }
                current_log.append(log_entry)

        event.audit_log = current_log
        event.save(update_fields=['audit_log'])

    @action(detail=True, methods=['post'], url_path='refund')
    def make_refund(self, request, pk=None):
        """Allows admin/staff to record a manual refund, updating received_amount and audit log."""
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"error": "Only staff members can make refunds."}, status=status.HTTP_403_FORBIDDEN)
            
        event = self.get_object()
        user = request.user
        
        try:
            refund_amount = float(request.data.get('amount', 0))
        except (ValueError, TypeError):
            return Response({"error": "Invalid refund amount."}, status=status.HTTP_400_BAD_REQUEST)
            
        if refund_amount <= 0:
            return Response({"error": "Refund amount must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
            
        current_received = float(event.received_amount or 0)
        
        if refund_amount > current_received:
            return Response(
                {"error": f"Refund amount cannot exceed total amount paid (€{current_received:.2f})."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Update event balance
        event.received_amount = current_received - refund_amount
        
        reason = request.data.get('reason', '')
        
        # Log the refund action
        log_entry = {
            'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
            'action': 'refund_made',
            'user': self._user_display(user),
            'amount_refunded': str(refund_amount),
            'reason': reason,
            'previous_received_amount': str(current_received),
            'new_received_amount': str(event.received_amount),
            'balance_due': str(float(event.budget or 0) - event.received_amount - float(event.payment_discount or 0))
        }
        
        current_log = list(event.audit_log or [])
        current_log.append(log_entry)
        event.audit_log = current_log
        
        event.save(update_fields=['received_amount', 'audit_log'])

        # Auto-create an Expense record so the financials tally
        from decimal import Decimal
        from django.utils.timezone import now as tz_now
        expense_reason = f"Refund – {event.event_name}"
        if reason:
            expense_reason += f": {reason}"
        Expense.objects.create(
            date=tz_now().date(),
            amount=Decimal(str(refund_amount)),
            reason=expense_reason,
            category='Refund',
            event=event,
            approved_by=user,
            paid_back=True,
            paid_back_at=tz_now(),
        )

        # Serialize and return updated event
        serializer = self.get_serializer(event)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='invoice/pdf')
    def generate_invoice_pdf(self, request, pk=None):
        import io
        import os
        from django.conf import settings
        from django.http import HttpResponse, HttpResponseForbidden
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
        from PIL import Image as PilImage

        event = self.get_object()
        log_idx = request.query_params.get('logIdx')
        
        target_log = None
        if log_idx is not None and event.audit_log:
            try:
                idx = int(log_idx)
                # Frontend reverses the list, so we might need to be careful with index mapping.
                # Assuming frontend passes the true array index from the reversed array:
                # `const auditLog = [...(event.audit_log || [])].reverse();` -> logIdx is based on this.
                actual_idx = len(event.audit_log) - 1 - idx
                if 0 <= actual_idx < len(event.audit_log):
                    target_log = event.audit_log[actual_idx]
            except ValueError:
                pass

        amount_paid_now = 0
        previously_paid = 0
        balance_due = 0
        invoice_date = __import__('django.utils.timezone', fromlist=['now']).now()
        user_name = "System"
        if request.user.is_authenticated:
            user_name = self._user_display(request.user)

        if target_log and target_log.get('action') == 'payment_received':
            try:
                invoice_date_str = target_log.get('timestamp')
                from dateutil.parser import parse
                if invoice_date_str: invoice_date = parse(invoice_date_str)
            except: pass
            
            total_received_up_to_then = float(target_log.get('total_amount_received', 0))
            amount_paid_now = float(target_log.get('amount_received_now', 0))
            previously_paid = total_received_up_to_then - amount_paid_now
            balance_due = float(target_log.get('remaining_balance', 0))
            
            user_name = target_log.get('user', user_name)
        else:
            # Fallback for old events without specific payment_received logs
            amount_paid_now = float(event.received_amount or 0)
            previously_paid = 0
            balance_due = float(event.budget or 0) - amount_paid_now - float(event.payment_discount or 0)

        # Clean up user_name to remove trailing username in parentheses (e.g. "Eby Chacko (eby)" -> "Eby Chacko")
        import re
        user_name = re.sub(r'\s*\(.*?\)\s*$', '', user_name)


        # Setup document
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=20*mm, leftMargin=20*mm,
            topMargin=20*mm, bottomMargin=20*mm
        )
        elems = []
        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = ParagraphStyle(
            'TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=24,
            textColor=colors.HexColor('#012d2d'), alignment=0, spaceAfter=8
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=10,
            textColor=colors.HexColor('#666666'), alignment=0, spaceAfter=4
        )
        
        # Logo Logic
        base_dir = settings.BASE_DIR
        logo_path = os.path.join(base_dir.parent, 'frontend', 'src', 'assets', 'images', 'logo.png')
        colored_logo_buffer = None
        if os.path.exists(logo_path):
            try:
                img = PilImage.open(logo_path).convert("RGBA")
                alpha = img.split()[-1]
                solid_color = PilImage.new("RGBA", img.size, (1, 45, 45, 255))
                colored_logo = PilImage.composite(solid_color, PilImage.new("RGBA", img.size, (255, 255, 255, 0)), alpha)
                colored_logo_buffer = io.BytesIO()
                colored_logo.save(colored_logo_buffer, format="PNG")
                colored_logo_buffer.seek(0)
            except Exception as e:
                logger.error('Error processing logo: %s', e)

        brand_title = '<font name="Times-Bold" color="#012d2d" size="24">CRYSTAL </font><font name="Times-Roman" color="#012d2d" size="24">EVENTS</font>'
        
        if colored_logo_buffer:
            from reportlab.platypus import Image
            colored_logo_buffer.seek(0)
            logo = Image(colored_logo_buffer, width=25*mm, height=25*mm)
            header_text = [
                Paragraph(brand_title, title_style),
                Spacer(1, 4),
                Paragraph('Ballinasloe, Galway, Ireland | Redhill, London, UK', subtitle_style),
                Paragraph('info@crystaleventsie.com | IE: +353 892331060 / +353 894173337 | UK: +44 7436586579', subtitle_style)
            ]
            header_data = [[logo, header_text]]
            header_table = Table(header_data, colWidths=[35*mm, 150*mm])
            header_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ]))
            elems.append(header_table)
        else:
            elems.append(Paragraph(brand_title, title_style))
            elems.append(Spacer(1, 4))
            elems.append(Paragraph('Ballinasloe, Galway, Ireland | Redhill, London, UK', subtitle_style))
            elems.append(Paragraph('info@crystaleventsie.com | IE: +353 892331060 / +353 894173337 | UK: +44 7436586579', subtitle_style))

        elems.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#EEC059'), spaceAfter=12, spaceBefore=2))

        # Centered Heading
        inv_title_style = ParagraphStyle('InvTitle', parent=styles['Normal'], fontSize=16, leading=20, alignment=TA_CENTER, fontName='Helvetica-Bold', textColor=colors.HexColor('#012d2d'))
        elems.append(Paragraph("INVOICE", inv_title_style))
        elems.append(Spacer(1, 15))

        # Invoice / Receipt Header
        inv_date_str = invoice_date.strftime('%d %B %Y')
        invoice_number = f"INV-{event.id}-{log_idx if log_idx is not None else 'F'}"
        q_details_data = [
            ['Invoice #:', invoice_number, 'Date:', inv_date_str],
            ['Event:', event.event_name, 'Process By:', user_name]
        ]
        q_details_table = Table(q_details_data, colWidths=[80, 155, 75, 120])
        q_details_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#333333')),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elems.append(q_details_table)
        elems.append(Spacer(1, 10))

        # Customer Details
        info_data = [
            ['Client Name:', event.client_name, 'Client Phone:', event.client_phone or '—'],
            ['Client Email:', event.client_email or '—', '', ''],
        ]
        if event.client_address:
            wrapped_addr = Paragraph(event.client_address, ParagraphStyle('AddrWrap', parent=styles['Normal'], fontSize=9, leading=11, textColor=colors.HexColor('#333333')))
            info_data.append(['Address:', wrapped_addr, '', ''])
            
        info_table = Table(info_data, colWidths=[80, 155, 75, 120])
        info_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#333333')),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elems.append(info_table)
        elems.append(Spacer(1, 6))

        # Services Table
        table_data = [['#', 'Service', 'Amount (€)']]
        
        snapshot_items = target_log.get('quote_items_snapshot') if target_log else None
        
        if snapshot_items is not None:
            for i, item_data in enumerate(snapshot_items, 1):
                service_text = item_data.get('service_name', '')
                if service_text == 'Special Requirement' and item_data.get('comment'):
                    service_text = item_data.get('comment')
                    
                service_col = Paragraph(service_text, ParagraphStyle('ServiceWrap', parent=styles['Normal'], fontSize=9, leading=11))
                table_data.append([str(i), service_col, f"€{float(item_data.get('quoted_amount', 0)):,.2f}"])
        else:
            # Fallback for old invoices without snapshots
            quote_to_use = event.quotes.filter(status='accepted').first() or event.quotes.order_by('-created_at').first()
            
            if quote_to_use and quote_to_use.items.exists():
                for i, item in enumerate(quote_to_use.items.all(), 1):
                    service_text = item.service.name
                    if item.service.name == 'Special Requirement' and item.comment:
                        service_text = item.comment
                        
                    service_col = Paragraph(service_text, ParagraphStyle('ServiceWrap', parent=styles['Normal'], fontSize=9, leading=11))
                    table_data.append([str(i), service_col, f'€{item.quoted_amount:,.2f}'])
            else:
                table_data.append(['1', 'Event Services', f'€{float(event.budget or 0):,.2f}'])
    
            # We need to grab Travel Cost from the quote if there is one
            travel_cost = float(quote_to_use.travel_cost) if quote_to_use and getattr(quote_to_use, 'travel_cost', 0) else 0.0

            if travel_cost > 0:
                travel_col = Paragraph("Travel Expense", ParagraphStyle('ServiceWrap', parent=styles['Normal'], fontSize=9, leading=11))
                table_data.append([str(len(table_data)), travel_col, f'€{travel_cost:,.2f}'])

            catering_cost = float(quote_to_use.catering_cost) if quote_to_use and getattr(quote_to_use, 'catering_cost', 0) else 0.0
            if catering_cost > 0:
                food_menu = None
                try:
                    food_menu = event.food_menu
                except Exception:
                    food_menu = None
                sub_style = ParagraphStyle('SubDetail', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=colors.HexColor('#666666'))
                wrap_style = ParagraphStyle('ServiceWrap', parent=styles['Normal'], fontSize=9, leading=11)
                if food_menu:
                    items_extra = sum(float(it.amount) for it in food_menu.items.all() if it.amount is not None)
                    base_catering = catering_cost - items_extra
                    lines = [f'<font size="9">Catering</font>']
                    if base_catering > 0:
                        lines.append(f'<font size="7" color="#888888">  {food_menu.adult_count} Adult(s) × €{float(food_menu.adult_rate):,.2f} + {food_menu.kid_count} Kid(s) × €{float(food_menu.kid_rate):,.2f}  →  €{base_catering:,.2f}</font>')
                    for it in food_menu.items.all():
                        if it.amount is not None:
                            lines.append(f'<font size="7" color="#888888">  {it.name}: +€{float(it.amount):,.2f}</font>')
                    catering_col = Paragraph('<br/>'.join(lines), wrap_style)
                else:
                    catering_col = Paragraph('Catering', wrap_style)
                table_data.append([str(len(table_data)), catering_col, f'€{catering_cost:,.2f}'])

        svc_table = Table(table_data, colWidths=[30, 310, 100])
        svc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#012d2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#333333')),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f8f8')]),
            ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#012d2d')),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.HexColor('#cccccc')),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#e0e0e0')),
        ]))
        elems.append(svc_table)
        elems.append(Spacer(1, 10))

        # Financial Totals
        if target_log and 'discount' in target_log:
            discount = float(target_log.get('discount', 0))
            total_project_cost = float(target_log.get('quoted_amount', 0))
        elif target_log and target_log.get('action') == 'payment_received':
            total_project_cost = float(target_log.get('quoted_amount', event.budget or 0))
            tot_rec = float(target_log.get('total_amount_received', 0))
            rem_bal = float(target_log.get('remaining_balance', 0))
            # Calculate what the discount MUST have been at the time of this payment log
            discount = total_project_cost - tot_rec - rem_bal
        else:
            total_project_cost = float(event.budget or 0)
            discount = float(event.payment_discount or 0)
            
        subtotal = total_project_cost - discount
        total_paid = previously_paid + amount_paid_now

        totals_data = [
            ['', 'Total Project Cost:', f'€{total_project_cost:,.2f}'],
        ]
            
        if discount > 0:
            totals_data.append(['', 'Discount:', f'-€{discount:,.2f}'])
            totals_data.append(['', 'Subtotal:', f'€{subtotal:,.2f}'])
            
        totals_data.extend([
            ['', 'Paid Now:', f'€{amount_paid_now:,.2f}'],
            ['', 'Total Paid:', f'€{total_paid:,.2f}']
        ])
        
        if balance_due > 0:
            totals_data.append(['', 'Balance Due:', f'€{balance_due:,.2f}'])

        style = TableStyle([
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (1, 0), (-1, -1), colors.HexColor('#333333')),
            
            # Find index of 'Paid Now'
            ('FONTNAME', (1, -2 if balance_due > 0 else -1), (-1, -2 if balance_due > 0 else -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (1, -2 if balance_due > 0 else -1), (-1, -2 if balance_due > 0 else -1), colors.HexColor('#012d2d')),
        ])
        
        if balance_due > 0:
            # Format Balance Due (Bold)
            style.add('FONTNAME', (1, -1), (-1, -1), 'Helvetica-Bold')
            style.add('FONTSIZE', (1, -1), (-1, -1), 12)
            style.add('TEXTCOLOR', (1, -1), (-1, -1), colors.HexColor('#012d2d'))
            style.add('LINEABOVE', (1, -1), (-1, -1), 1.5, colors.HexColor('#EEC059'))

        style.add('TOPPADDING', (0, 0), (-1, -1), 4)
        style.add('BOTTOMPADDING', (0, 0), (-1, -1), 4)

        totals_table = Table(totals_data, colWidths=[240, 100, 100])
        totals_table.setStyle(style)
        elems.append(totals_table)

        # Footer
        elems.append(Spacer(1, 30))
        elems.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#cccccc'), spaceAfter=8))
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#999999'), alignment=TA_CENTER)
        elems.append(Paragraph('CRYSTAL EVENTS | Ballinasloe, Galway, Ireland & Redhill, London, UK | info@crystaleventsie.com', footer_style))
        elems.append(Paragraph('Thank you for your business! We look forward to working with you again.', footer_style))

        # Watermark drawing function
        def draw_watermark(canvas, doc):
            canvas.saveState()
            if colored_logo_buffer:
                from reportlab.lib.utils import ImageReader
                # Set opacity to 70% reduction visually (0.07 actual drawing alpha)
                canvas.setFillAlpha(0.07)
                # Calculate center position with a slight top padding offset as requested
                page_width, page_height = A4
                logo_width = 150*mm
                logo_height = 150*mm
                x = (page_width - logo_width) / 2
                y = ((page_height - logo_height) / 2) - (20*mm) # Moved slightly down visually giving it top padding
                colored_logo_buffer.seek(0)
                ir = ImageReader(colored_logo_buffer)
                canvas.drawImage(ir, x, y, width=logo_width, height=logo_height, mask='auto', preserveAspectRatio=True)
            canvas.restoreState()

        # Build PDF
        doc.build(elems, onFirstPage=draw_watermark, onLaterPages=draw_watermark)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f"Invoice_{event.event_name.replace(' ', '_')}_{inv_date_str.replace(' ', '_')}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response

    @action(detail=True, methods=['get'], url_path='refund/pdf')
    def generate_refund_pdf(self, request, pk=None):
        import io
        import os
        import re
        from django.conf import settings
        from django.http import HttpResponse, HttpResponseForbidden
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
        from PIL import Image as PilImage

        event = self.get_object()
        log_idx = request.query_params.get('logIdx')

        # Find the refund log entry
        target_log = None
        if log_idx is not None and event.audit_log:
            try:
                idx = int(log_idx)
                actual_idx = len(event.audit_log) - 1 - idx
                if 0 <= actual_idx < len(event.audit_log):
                    candidate = event.audit_log[actual_idx]
                    if candidate.get('action') == 'refund_made':
                        target_log = candidate
            except ValueError:
                pass

        # Fall back to the most recent refund_made entry
        if target_log is None and event.audit_log:
            for entry in reversed(event.audit_log):
                if entry.get('action') == 'refund_made':
                    target_log = entry
                    break

        if target_log is None:
            return HttpResponse("No refund record found.", status=404)

        # Extract values from log entry
        try:
            from dateutil.parser import parse as parse_date
            refund_date = parse_date(target_log.get('timestamp'))
        except Exception:
            from django.utils.timezone import now
            refund_date = now()

        amount_refunded = float(target_log.get('amount_refunded', 0))
        previous_paid   = float(target_log.get('previous_received_amount', 0))
        new_paid        = float(target_log.get('new_received_amount', 0))
        new_balance     = float(target_log.get('balance_due', 0))
        reason          = target_log.get('reason', '')
        user_name       = re.sub(r'\s*\(.*?\)\s*$', '', target_log.get('user', self._user_display(request.user)))

        # ── Build PDF ──────────────────────────────────────────────────
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=20*mm, leftMargin=20*mm,
            topMargin=20*mm, bottomMargin=20*mm
        )
        elems = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=24,
            textColor=colors.HexColor('#012d2d'), alignment=0, spaceAfter=8
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=10,
            textColor=colors.HexColor('#666666'), alignment=0, spaceAfter=4
        )

        # Logo
        base_dir = settings.BASE_DIR
        logo_path = os.path.join(base_dir.parent, 'frontend', 'src', 'assets', 'images', 'logo.png')
        colored_logo_buffer = None
        if os.path.exists(logo_path):
            try:
                img = PilImage.open(logo_path).convert("RGBA")
                alpha = img.split()[-1]
                solid_color = PilImage.new("RGBA", img.size, (1, 45, 45, 255))
                colored_logo = PilImage.composite(solid_color, PilImage.new("RGBA", img.size, (255, 255, 255, 0)), alpha)
                colored_logo_buffer = io.BytesIO()
                colored_logo.save(colored_logo_buffer, format="PNG")
                colored_logo_buffer.seek(0)
            except Exception:
                pass

        brand_title = '<font name="Times-Bold" color="#012d2d" size="24">CRYSTAL </font><font name="Times-Roman" color="#012d2d" size="24">EVENTS</font>'

        if colored_logo_buffer:
            colored_logo_buffer.seek(0)
            logo = Image(colored_logo_buffer, width=25*mm, height=25*mm)
            header_text = [
                Paragraph(brand_title, title_style),
                Spacer(1, 4),
                Paragraph('Ballinasloe, Galway, Ireland | Redhill, London, UK', subtitle_style),
                Paragraph('info@crystaleventsie.com | IE: +353 892331060 / +353 894173337 | UK: +44 7436586579', subtitle_style)
            ]
            header_data = [[logo, header_text]]
            header_table = Table(header_data, colWidths=[35*mm, 150*mm])
            header_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ]))
            elems.append(header_table)
        else:
            elems.append(Paragraph(brand_title, title_style))
            elems.append(Spacer(1, 4))
            elems.append(Paragraph('Ballinasloe, Galway, Ireland | Redhill, London, UK', subtitle_style))
            elems.append(Paragraph('info@crystaleventsie.com | IE: +353 892331060 / +353 894173337 | UK: +44 7436586579', subtitle_style))

        elems.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#EEC059'), spaceAfter=12, spaceBefore=2))

        # Document title
        doc_title_style = ParagraphStyle('DocTitle', parent=styles['Normal'], fontSize=16, leading=20, alignment=TA_CENTER, fontName='Helvetica-Bold', textColor=colors.HexColor('#8B0000'))
        elems.append(Paragraph("CREDIT NOTE / REFUND", doc_title_style))
        elems.append(Spacer(1, 15))

        # Reference header
        ref_date_str = refund_date.strftime('%d %B %Y')
        ref_number = f"REF-{event.id}-{log_idx if log_idx is not None else 'F'}"
        ref_data = [
            ['Ref #:', ref_number, 'Date:', ref_date_str],
            ['Event:', event.event_name, 'Processed By:', user_name]
        ]
        ref_table = Table(ref_data, colWidths=[80, 155, 75, 120])
        ref_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#333333')),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elems.append(ref_table)
        elems.append(Spacer(1, 10))

        # Client details
        info_data = [
            ['Client Name:', event.client_name, 'Client Phone:', event.client_phone or '—'],
            ['Client Email:', event.client_email or '—', '', ''],
        ]
        if event.client_address:
            wrapped_addr = Paragraph(event.client_address, ParagraphStyle('AddrWrap', parent=styles['Normal'], fontSize=9, leading=11, textColor=colors.HexColor('#333333')))
            info_data.append(['Address:', wrapped_addr, '', ''])

        info_table = Table(info_data, colWidths=[80, 155, 75, 120])
        info_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#333333')),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elems.append(info_table)
        elems.append(Spacer(1, 16))

        # Refund summary section heading
        section_style = ParagraphStyle('Section', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold', textColor=colors.HexColor('#012d2d'), spaceAfter=8)
        elems.append(Paragraph("Refund Summary", section_style))

        # Refund details table
        refund_rows = [
            ['Description', 'Amount (€)'],
            ['Previous Total Paid', f'€{previous_paid:,.2f}'],
            ['Amount Refunded', f'-€{amount_refunded:,.2f}'],
            ['New Total Paid (After Refund)', f'€{new_paid:,.2f}'],
        ]
        if new_balance > 0:
            refund_rows.append(['New Balance Due', f'€{new_balance:,.2f}'])

        refund_table = Table(refund_rows, colWidths=[340, 100])
        n = len(refund_rows)
        refund_style = TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B0000')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            # Body rows
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#333333')),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 7),
            ('TOPPADDING', (0, 1), (-1, -1), 7),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fdf5f5')]),
            ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#8B0000')),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.HexColor('#cccccc')),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#e0e0e0')),
            # Highlight the refunded amount row (row 2)
            ('TEXTCOLOR', (1, 2), (1, 2), colors.HexColor('#8B0000')),
            ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
            # Highlight the "New Total Paid" row (row 3)
            ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
            ('TEXTCOLOR', (1, 3), (1, 3), colors.HexColor('#012d2d')),
        ])
        # If balance due row present (row 4), bold it with gold line
        if new_balance > 0:
            refund_style.add('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold')
            refund_style.add('FONTSIZE', (1, 4), (1, 4), 11)
            refund_style.add('TEXTCOLOR', (1, 4), (1, 4), colors.HexColor('#012d2d'))
            refund_style.add('LINEABOVE', (1, 4), (-1, 4), 1.5, colors.HexColor('#EEC059'))

        refund_table.setStyle(refund_style)
        elems.append(refund_table)

        # Reason box
        if reason:
            elems.append(Spacer(1, 16))
            reason_label_style = ParagraphStyle('ReasonLabel', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#8B0000'), spaceAfter=4)
            reason_text_style  = ParagraphStyle('ReasonText',  parent=styles['Normal'], fontSize=9, fontName='Helvetica-Oblique', textColor=colors.HexColor('#333333'), leading=13)
            elems.append(Paragraph("Reason for Refund:", reason_label_style))
            reason_para = Paragraph(reason, reason_text_style)
            reason_box = Table([[reason_para]], colWidths=[440])
            reason_box.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff5f5')),
                ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#8B0000')),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('LEFTPADDING', (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ]))
            elems.append(reason_box)

        # Footer
        elems.append(Spacer(1, 30))
        elems.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#cccccc'), spaceAfter=8))
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#999999'), alignment=TA_CENTER)
        elems.append(Paragraph('CRYSTAL EVENTS | Ballinasloe, Galway, Ireland & Redhill, London, UK | info@crystaleventsie.com', footer_style))
        elems.append(Paragraph('This credit note confirms a refund has been processed. Please retain for your records.', footer_style))

        # Watermark
        def draw_watermark(canvas, doc):
            canvas.saveState()
            if colored_logo_buffer:
                from reportlab.lib.utils import ImageReader
                canvas.setFillAlpha(0.07)
                page_width, page_height = A4
                logo_width = 150*mm
                logo_height = 150*mm
                x = (page_width - logo_width) / 2
                y = ((page_height - logo_height) / 2) - (20*mm)
                colored_logo_buffer.seek(0)
                ir = ImageReader(colored_logo_buffer)
                canvas.drawImage(ir, x, y, width=logo_width, height=logo_height, mask='auto', preserveAspectRatio=True)
            canvas.restoreState()

        doc.build(elems, onFirstPage=draw_watermark, onLaterPages=draw_watermark)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f"CreditNote_{event.event_name.replace(' ', '_')}_{ref_date_str.replace(' ', '_')}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'])
    def staff_list(self, request):
        """Return a simple list of staff users for the assignment dropdown."""
        staff = User.objects.filter(is_staff=True).values('id', 'first_name', 'last_name', 'username')
        return Response(list(staff))

    @action(detail=True, methods=['get'], url_path='notes/pdf')
    def notes_pdf(self, request, pk=None):
        """Generate a staff-only PDF containing the event's internal notes and linked quote summary."""
        import io
        import os
        from django.conf import settings
        from django.http import HttpResponse, HttpResponseForbidden
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
        from reportlab.pdfgen import canvas as rl_canvas
        from PIL import Image as PilImage
        if not request.user.is_staff:
            return HttpResponseForbidden('Staff access only')

        event = self.get_object()

        # ── Logo ──────────────────────────────────────────────────────────
        base_dir = settings.BASE_DIR
        logo_path = os.path.join(base_dir.parent, 'frontend', 'src', 'assets', 'images', 'logo.png')
        colored_logo_buffer = None
        if os.path.exists(logo_path):
            try:
                img = PilImage.open(logo_path).convert('RGBA')
                alpha = img.split()[-1]
                solid_color = PilImage.new('RGBA', img.size, (1, 45, 45, 255))
                colored_logo = PilImage.composite(solid_color, PilImage.new('RGBA', img.size, (255, 255, 255, 0)), alpha)
                colored_logo_buffer = io.BytesIO()
                colored_logo.save(colored_logo_buffer, format='PNG')
                colored_logo_buffer.seek(0)
            except Exception as e:
                logger.error('Error processing logo: %s', e)

        # ── NumberedCanvas for "Page X / Y" ───────────────────────────────
        class NumberedCanvas(rl_canvas.Canvas):
            def __init__(self, *args, **kwargs):
                rl_canvas.Canvas.__init__(self, *args, **kwargs)
                self._saved_page_states = []

            def showPage(self):
                self._saved_page_states.append(dict(self.__dict__))
                self._startPage()

            def save(self):
                num_pages = len(self._saved_page_states)
                for state in self._saved_page_states:
                    self.__dict__.update(state)
                    self._draw_page_number(num_pages)
                    rl_canvas.Canvas.showPage(self)
                rl_canvas.Canvas.save(self)

            def _draw_page_number(self, page_count):
                # Watermark
                if colored_logo_buffer:
                    from reportlab.lib.utils import ImageReader
                    self.saveState()
                    self.setFillAlpha(0.05)
                    pw, ph = A4
                    lw = lh = 150 * mm
                    colored_logo_buffer.seek(0)
                    self.drawImage(ImageReader(colored_logo_buffer),
                                   (pw - lw) / 2, (ph - lh) / 2 - 20 * mm,
                                   width=lw, height=lh, mask='auto', preserveAspectRatio=True)
                    self.restoreState()
                # Page number bottom-right
                self.saveState()
                self.setFont('Helvetica', 8)
                self.setFillColor(colors.HexColor('#999999'))
                self.drawRightString(A4[0] - 20 * mm, 12 * mm,
                                     f'Page {self._pageNumber} / {page_count}')
                self.restoreState()

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=20*mm, leftMargin=20*mm,
            topMargin=20*mm, bottomMargin=28*mm   # extra bottom for page number
        )
        styles = getSampleStyleSheet()
        elems = []

        # ── Styles ────────────────────────────────────────────────────────
        title_style = ParagraphStyle(
            'NTitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=24,
            textColor=colors.HexColor('#012d2d'), alignment=0, spaceAfter=8
        )
        subtitle_style = ParagraphStyle(
            'NSubtitleStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=10,
            textColor=colors.HexColor('#666666'), alignment=0, spaceAfter=4
        )
        section_heading_style = ParagraphStyle(
            'NSecHead', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=11,
            textColor=colors.HexColor('#012d2d'), spaceAfter=6, spaceBefore=14
        )
        notes_style = ParagraphStyle(
            'NNotes', parent=styles['Normal'], fontName='Helvetica', fontSize=10,
            textColor=colors.HexColor('#222222'), leading=15, spaceAfter=4
        )
        footer_style = ParagraphStyle(
            'NFooter', parent=styles['Normal'], fontSize=8,
            textColor=colors.HexColor('#999999'), alignment=TA_CENTER
        )
        desc_style = ParagraphStyle(
            'NDesc', parent=styles['Normal'], fontName='Helvetica', fontSize=8,
            textColor=colors.HexColor('#555555'), leading=11
        )

        brand_title = '<font name="Times-Bold" color="#012d2d" size="24">CRYSTAL </font><font name="Times-Roman" color="#012d2d" size="24">EVENTS</font>'

        # ── Header ────────────────────────────────────────────────────────
        if colored_logo_buffer:
            colored_logo_buffer.seek(0)
            logo = Image(colored_logo_buffer, width=25*mm, height=25*mm)
            header_text = [
                Paragraph(brand_title, title_style),
                Spacer(1, 4),
                Paragraph('Ballinasloe, Galway, Ireland | Redhill, London, UK', subtitle_style),
                Paragraph('info@crystaleventsie.com | IE: +353 892331060 / +353 894173337 | UK: +44 7436586579', subtitle_style),
            ]
            header_data = [[logo, header_text]]
            header_table = Table(header_data, colWidths=[35*mm, 150*mm])
            header_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            elems.append(header_table)
        else:
            elems.append(Paragraph(brand_title, title_style))
            elems.append(Spacer(1, 4))
            elems.append(Paragraph('Ballinasloe, Galway, Ireland | Redhill, London, UK', subtitle_style))
            elems.append(Paragraph('info@crystaleventsie.com | IE: +353 892331060 / +353 894173337 | UK: +44 7436586579', subtitle_style))

        elems.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#EEC059'), spaceAfter=12, spaceBefore=2))

        # Staff badge
        badge_style = ParagraphStyle(
            'NBadge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9,
            textColor=colors.HexColor('#7a4f00'), alignment=0
        )
        badge_table = Table([[Paragraph('⚠  STAFF INTERNAL DOCUMENT — NOT FOR CLIENT DISTRIBUTION', badge_style)]],
                            colWidths=[170*mm])
        badge_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff8e5')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#EEC059')),
        ]))
        elems.append(badge_table)
        elems.append(Spacer(1, 10))

        # ── Event Overview (no email, date + venue bolded) ─────────────────
        elems.append(Paragraph('Event Overview', section_heading_style))
        ev_date_str = event.event_date.strftime('%d %B %Y, %H:%M') if event.event_date else '—'
        ev_venue = event.venue or '—'
        ev_data = [
            ['Event Name:', event.event_name or '—', 'Type:', event.get_event_type_display()],
            ['Client:', event.client_name or '—', 'Phone:', event.client_phone or '—'],
            ['Date:', Paragraph(f'<b>{ev_date_str}</b>', ParagraphStyle('bold9', fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#012d2d'))),
             'Venue:', Paragraph(f'<b>{ev_venue}</b>', ParagraphStyle('bold9v', fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#012d2d')))],
        ]

        ev_table = Table(ev_data, colWidths=[30*mm, 60*mm, 25*mm, 55*mm])
        ev_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#222222')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#222222')),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),   # event name bold
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8f8f8')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elems.append(ev_table)

        # ── Quote Summary (FIRST — no amounts, with descriptions) ──────────
        quote = event.quotes.filter(status='accepted').first() or event.quotes.order_by('-created_at').first()
        if quote:
            elems.append(Spacer(1, 6))
            elems.append(Paragraph('Services', section_heading_style))

            svc_header = [['#', 'Service', 'Service Notes']]
            svc_rows = []
            for i, item in enumerate(quote.items.select_related('service').all(), 1):
                desc = item.comment if item.comment and item.comment.strip() else '—'
                svc_rows.append([
                    str(i),
                    Paragraph(f'<b>{item.service.name}</b>', ParagraphStyle('svcname', fontSize=9, fontName='Helvetica-Bold')),
                    Paragraph(desc, desc_style),
                ])

            svc_data = svc_header + svc_rows
            svc_table = Table(svc_data, colWidths=[12*mm, 58*mm, 100*mm])
            svc_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#012d2d')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('TOPPADDING', (0, 0), (-1, 0), 8),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#333333')),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 7),
                ('TOPPADDING', (0, 1), (-1, -1), 7),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f8f8')]),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#012d2d')),
                ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#e0e0e0')),
            ]))
            elems.append(svc_table)

        # ── Internal Notes (AFTER quote) ──────────────────────────────────
        elems.append(Spacer(1, 6))
        elems.append(Paragraph('Internal Notes', section_heading_style))
        if event.notes:
            note_lines = event.notes.replace('\r\n', '\n').split('\n')
            for line in note_lines:
                elems.append(Paragraph(line if line.strip() else '&nbsp;', notes_style))
        else:
            elems.append(Paragraph('<i>No internal notes recorded.</i>', notes_style))

        # ── Footer line ───────────────────────────────────────────────────
        elems.append(Spacer(1, 18))
        elems.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#cccccc'), spaceAfter=6))
        printed_by = self._user_display(request.user)
        from django.utils import timezone as tz
        printed_at = tz.now().strftime('%d %B %Y, %H:%M UTC')
        elems.append(Paragraph(
            f'CRYSTAL EVENTS | Internal Document | Printed by: {printed_by} on {printed_at}',
            footer_style
        ))

        doc.build(elems, canvasmaker=NumberedCanvas)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        safe_name = event.event_name.replace(' ', '_')
        response['Content-Disposition'] = f'inline; filename="Notes_{safe_name}.pdf"'
        return response

    @action(detail=True, methods=['delete'], url_path='delete_log_entry',
            permission_classes=[permissions.IsAuthenticated, IsSuperUser])
    def delete_log_entry(self, request, pk=None):
        """Delete a single audit log entry by its reversed index. Superuser only."""
        event = self.get_object()
        try:
            log_idx = int(request.query_params.get('log_idx', ''))
        except (TypeError, ValueError):
            return Response({'error': 'log_idx query param required.'}, status=status.HTTP_400_BAD_REQUEST)

        log = list(event.audit_log or [])
        actual_idx = len(log) - 1 - log_idx
        if actual_idx < 0 or actual_idx >= len(log):
            return Response({'error': 'Log entry not found.'}, status=status.HTTP_404_NOT_FOUND)

        log.pop(actual_idx)
        event.audit_log = log
        event.save(update_fields=['audit_log'])
        logger.info('Audit log entry %s deleted from event %s by %s', log_idx, event.id, request.user)
        return Response({'audit_log': log}, status=status.HTTP_200_OK)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrFinancials]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Expense.objects.select_related('event', 'approved_by', 'paid_by').all()
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        paid_by = self.request.query_params.get('paid_by')
        if paid_by:
            queryset = queryset.filter(paid_by=paid_by)
        return queryset

    def _save_with_image(self, serializer, **kwargs):
        file = self.request.FILES.get('receipt_image')
        err = _validate_upload(file)
        if err:
            raise serializers.ValidationError({'receipt_image': err})
        url = _cloudinary_upload(file, 'expenses')
        if url:
            return serializer.save(receipt_image=None, receipt_image_url=url, **kwargs)
        return serializer.save(**kwargs)

    def perform_create(self, serializer):
        self._save_with_image(serializer)

    def perform_update(self, serializer):
        # If paid_by is being cleared, reset paid_back so no ghost pending reimbursements remain
        if 'paid_by' in serializer.validated_data and serializer.validated_data['paid_by'] is None:
            serializer.validated_data['paid_back'] = False
            serializer.validated_data['paid_back_at'] = None
        self._save_with_image(serializer)

    @action(detail=False, methods=['post'], url_path='bulk_mark_paid_back')
    def bulk_mark_paid_back(self, request):
        from django.utils import timezone
        ids = request.data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({'error': 'No ids provided.'}, status=400)
        if len(ids) > 100:
            return Response({'error': 'Maximum 100 items per request.'}, status=400)
        try:
            safe_ids = [int(i) for i in ids]
        except (ValueError, TypeError):
            return Response({'error': 'Invalid ID format.'}, status=400)
        Expense.objects.filter(id__in=safe_ids).update(paid_back=True, paid_back_at=timezone.now())
        return Response({'updated': len(safe_ids)})


class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsStaffOrAssets()]

    def get_queryset(self):
        return Asset.objects.select_related('added_by').all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)


class EventImageViewSet(viewsets.ModelViewSet):
    queryset = EventImage.objects.all()
    serializer_class = EventImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        file = self.request.FILES.get('image')
        err = _validate_upload(file)
        if err:
            raise serializers.ValidationError({'image': err})
        url = _cloudinary_upload(file, 'event_galleries')
        if url:
            serializer.save(image=None, image_url=url)
        else:
            serializer.save()

    def perform_update(self, serializer):
        file = self.request.FILES.get('image')
        url = _cloudinary_upload(file, 'event_galleries')
        if url:
            serializer.save(image=None, image_url=url)
        else:
            serializer.save()


class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.select_related('user', 'user__profile').all()
    serializer_class = TeamMemberSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsSuperUser()]

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSuperUser])
    def reorder(self, request):
        ordered_ids = request.data.get('ordered_ids', [])
        if not isinstance(ordered_ids, list):
            return Response({"error": "ordered_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update order in a single loop
        from django.db import transaction
        with transaction.atomic():
            for index, pk in enumerate(ordered_ids):
                TeamMember.objects.filter(pk=pk).update(order=index)
                
        return Response({"message": "Order updated successfully"})


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.prefetch_related('items', 'items__service').select_related('event').all()
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrFinancials]

    def _log_quote_action(self, quote, action, user, old_quote_data=None):
        """Append a quote-related entry to the linked event's audit log."""
        if not quote.event:
            return
        event = quote.event
        from django.utils import timezone
        new_services_detail = [
            {
                'name': item.service.name,
                'amount': str(item.quoted_amount),
                'description': item.comment or ''
            } for item in quote.items.select_related('service').all()
        ]
        entry = {
            'timestamp': timezone.now().isoformat(),
            'action': action,
            'user': f"{user.first_name} {user.last_name}".strip() or user.username,
            'quote_id': quote.id,
            'quote_subtotal': str(quote.subtotal),
            'quote_discount': str(quote.discount_amount),
            'quote_total': str(quote.total),
            'quote_status': quote.get_status_display(),
            'services_detail': new_services_detail,
            'services': [item.service.name for item in quote.items.select_related('service').all()],
        }

        if action == 'quote_updated' and old_quote_data:
            changes = {}
            simple_fields = [
                ('Status', old_quote_data.get('quote_status'), quote.get_status_display()),
                ('Travel Cost', old_quote_data.get('quote_travel_cost'), str(quote.travel_cost)),
                ('Catering Cost', old_quote_data.get('quote_catering_cost'), str(quote.catering_cost)),
                ('Discount %', old_quote_data.get('quote_discount_pct'), str(quote.discount_percentage)),
                ('Subtotal', old_quote_data.get('quote_subtotal'), str(quote.subtotal)),
                ('Total', old_quote_data.get('quote_total'), str(quote.total)),
            ]
            for label, old_val, new_val in simple_fields:
                if str(old_val) != str(new_val):
                    changes[label] = {'old': str(old_val), 'new': str(new_val)}
            old_svc = old_quote_data.get('services_detail', [])
            if old_svc != new_services_detail:
                changes['services'] = {'old': old_svc, 'new': new_services_detail}
            if changes:
                entry['changes'] = changes
        
        if quote.travel_cost and quote.travel_cost > 0:
            entry['services_detail'].append({
                'name': 'Travel Expense',
                'amount': str(quote.travel_cost),
                'description': 'Calculated based on distance'
            })
            entry['services'].append('Travel Expense')

        if quote.catering_cost and quote.catering_cost > 0:
            food_menu = None
            try:
                food_menu = event.food_menu
            except Exception:
                food_menu = None
            catering_description = ''
            if food_menu:
                items_extra = sum(float(it.amount) for it in food_menu.items.all() if it.amount is not None)
                base_catering = float(quote.catering_cost) - items_extra
                parts = []
                if base_catering > 0:
                    parts.append(f"{food_menu.adult_count} adult(s) × €{float(food_menu.adult_rate):,.2f} + {food_menu.kid_count} kid(s) × €{float(food_menu.kid_rate):,.2f}")
                for it in food_menu.items.all():
                    if it.amount is not None:
                        parts.append(f"{it.name}: +€{float(it.amount):,.2f}")
                catering_description = '; '.join(parts)
            entry['services_detail'].append({
                'name': 'Catering',
                'amount': str(quote.catering_cost),
                'description': catering_description
            })
            entry['services'].append('Catering')

        log = list(event.audit_log or [])
        log.append(entry)
        event.audit_log = log
        event.save(update_fields=['audit_log'])

    def _notify_quote_accepted(self, quote):
        try:
            from django.core.mail import EmailMultiAlternatives
            event_name = quote.event.event_name if quote.event else 'N/A'
            client = quote.client_name
            total = f"€{quote.total:,.2f}"
            recipients = [settings.NOTIFY_EMAIL]
            for profile in UserProfile.objects.select_related('user').filter(notify_quote_accepted=True, user__is_active=True):
                if profile.user.email and profile.user.email not in recipients:
                    recipients.append(profile.user.email)
            plain = (
                f"Quote #{quote.id} has been accepted.\n"
                f"Client: {client}\n"
                f"Event: {event_name}\n"
                f"Total: {total}"
            )
            html = f"""
<html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">
<div style="background:#1a3a3a;padding:24px 28px;">
  <h2 style="color:#10b981;margin:0;font-size:20px;">Quote Accepted ✓</h2>
</div>
<div style="padding:24px 28px;">
  <p style="font-size:15px;color:#333;">Quote <strong>#{quote.id}</strong> has been accepted.</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;color:#555;">
    <tr><td style="padding:6px 0;width:120px;color:#888;">Client</td><td>{client}</td></tr>
    <tr><td style="padding:6px 0;color:#888;">Event</td><td>{event_name}</td></tr>
    <tr><td style="padding:6px 0;color:#888;">Total</td><td style="color:#10b981;font-weight:bold;">{total}</td></tr>
  </table>
</div>
<div style="background:#f9f9f9;padding:14px 28px;font-size:12px;color:#aaa;">Crystal Events Admin</div>
</div></body></html>"""
            msg = EmailMultiAlternatives(
                subject=f'Quote #{quote.id} Accepted — {client}',
                body=plain,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipients,
            )
            msg.attach_alternative(html, 'text/html')
            msg.send(fail_silently=True)
        except Exception as e:
            logger.error('Error sending quote accepted notification: %s', e)

    def perform_create(self, serializer):
        quote = serializer.save()
        if quote.event:
            event = quote.event
            event.budget = quote.total

            # Recalculate event total receiving travel_cost logic handled from Quote creation
            update_fields = ['budget']
            if quote.status == 'accepted' and event.status != 'confirmed':
                event.status = 'confirmed'
                update_fields.append('status')

            event.save(update_fields=update_fields)

        if quote.status == 'accepted':
            self._notify_quote_accepted(quote)

        self._log_quote_action(quote, 'quote_created', self.request.user)

    def perform_update(self, serializer):
        old_quote = self.get_object()
        old_status = old_quote.status
        old_quote_data = {
            'quote_status': old_quote.get_status_display(),
            'quote_travel_cost': str(old_quote.travel_cost),
            'quote_catering_cost': str(old_quote.catering_cost),
            'quote_discount_pct': str(old_quote.discount_percentage),
            'quote_subtotal': str(old_quote.subtotal),
            'quote_total': str(old_quote.total),
            'services_detail': [
                {'name': item.service.name, 'amount': str(item.quoted_amount), 'description': item.comment or ''}
                for item in old_quote.items.select_related('service').all()
            ],
        }
        quote = serializer.save()
        if quote.event:
            event = quote.event
            event.budget = quote.total

            update_fields = ['budget']
            if quote.status == 'accepted' and event.status != 'confirmed':
                event.status = 'confirmed'
                update_fields.append('status')

            event.save(update_fields=update_fields)

        if quote.status == 'accepted' and old_status != 'accepted':
            self._notify_quote_accepted(quote)

        self._log_quote_action(quote, 'quote_updated', self.request.user, old_quote_data)

    @action(detail=True, methods=['get'], url_path='pdf')
    def generate_pdf(self, request, pk=None):
        import io
        import os
        from django.conf import settings
        from django.http import HttpResponse
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
        from PIL import Image as PilImage

        # Resolve logo path
        base_dir = settings.BASE_DIR
        logo_path = os.path.join(base_dir.parent, 'frontend', 'src', 'assets', 'images', 'logo.png')
        
        # Colorize logo to dark green (#012d2d)
        colored_logo_buffer = None
        if os.path.exists(logo_path):
            try:
                img = PilImage.open(logo_path).convert("RGBA")
                # Extract alpha channel
                alpha = img.split()[-1]
                # Create a new solid image with the dark green color #012d2d (1, 45, 45)
                solid_color = PilImage.new("RGBA", img.size, (1, 45, 45, 255))
                # Apply the original alpha mask to the solid color
                solid_color.putalpha(alpha)
                # Save to buffer
                colored_logo_buffer = io.BytesIO()
                solid_color.save(colored_logo_buffer, format='PNG')
                colored_logo_buffer.seek(0)
            except Exception as e:
                logger.error('Failed to colorize logo: %s', e)
                colored_logo_buffer = None

        quote = self.get_object()
        items = quote.items.select_related('service').all()
        event = quote.event

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=30*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle('QuoteTitle', parent=styles['Heading1'], fontSize=24, spaceAfter=2, textColor=colors.HexColor('#012d2d'), alignment=0)
        subtitle_style = ParagraphStyle('QuoteSubtitle', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#666666'), spaceAfter=4, alignment=0)
        heading_style = ParagraphStyle('SectionHeading', parent=styles['Heading3'], fontSize=11, textColor=colors.HexColor('#012d2d'), spaceAfter=6, spaceBefore=16)
        normal_style = ParagraphStyle('QuoteNormal', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#333333'), spaceAfter=3)

        elems = []

        # Formatted title text matching the requested brand style
        brand_title = '<font name="Times-Bold" color="#012d2d" size="24">CRYSTAL </font><font name="Times-Roman" color="#012d2d" size="24">EVENTS</font>'

        # Company Header with Logo
        header_data = []
        if colored_logo_buffer:
            # Reduced logo size as requested, using colorized buffer
            colored_logo_buffer.seek(0)
            logo = Image(colored_logo_buffer, width=25*mm, height=25*mm)
            header_text = [
                Paragraph(brand_title, title_style),
                Spacer(1, 4), # Added bottom padding for the company name to separate contact details
                Paragraph('Ballinasloe, Galway, Ireland | Redhill, London, UK', subtitle_style),
                Paragraph('info@crystaleventsie.com | IE: +353 892331060 / +353 894173337 | UK: +44 7436586579', subtitle_style)
            ]
            header_data = [[logo, header_text]]
            header_table = Table(header_data, colWidths=[35*mm, 150*mm])
            header_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ]))
            elems.append(header_table)
        else:
            elems.append(Paragraph(brand_title, title_style))
            elems.append(Spacer(1, 4))
            elems.append(Paragraph('Ballinasloe, Galway, Ireland | Redhill, London, UK', subtitle_style))
            elems.append(Paragraph('info@crystaleventsie.com | IE: +353 892331060 / +353 894173337 | UK: +44 7436586579', subtitle_style))

        elems.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#EEC059'), spaceAfter=12, spaceBefore=2))

        # Centered Heading
        quote_title_style = ParagraphStyle('QuoteTitle', parent=styles['Normal'], fontSize=16, leading=20, alignment=TA_CENTER, fontName='Helvetica-Bold', textColor=colors.HexColor('#012d2d'))
        elems.append(Paragraph("QUOTE", quote_title_style))
        elems.append(Spacer(1, 15))

        # Quote Details Table
        # We put Quote Number, Quote Date, Quote Status here
        quote_date = quote.created_at.strftime('%d %B %Y') if quote.created_at else ''
        q_details_data = [
            ['Quote Number:', str(quote.id), 'Quote Date:', quote_date],
            ['Quote Status:', quote.get_status_display(), '', '']
        ]
        q_details_table = Table(q_details_data, colWidths=[80, 155, 75, 120])
        q_details_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#333333')),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elems.append(q_details_table)
        elems.append(Spacer(1, 10))

        # Customer Details
        info_data = [
            ['Client Name:', quote.client_name, 'Client Phone:', quote.client_phone or '—'],
            ['Client Email:', quote.client_email or '—', '', ''],
        ]
        if quote.client_address:
            # Wrap address text if it's too long
            wrapped_addr = Paragraph(quote.client_address, ParagraphStyle('AddrWrap', parent=styles['Normal'], fontSize=9, leading=11, textColor=colors.HexColor('#333333')))
            info_data.append(['Address:', wrapped_addr, '', ''])
            
        info_table = Table(info_data, colWidths=[80, 155, 75, 120])
        info_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#888888')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#333333')),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elems.append(info_table)
        elems.append(Spacer(1, 6))

        # Event Details (if linked)
        if event:
            ev_date = event.event_date.strftime('%d %B %Y, %H:%M') if event.event_date else '—'
            ev_data = [
                ['Event:', event.event_name, 'Event Date:', ev_date],
                ['Venue:', event.venue or '—', 'Type:', event.get_event_type_display()],
            ]
            if event.hall_available_from:
                hall_str = event.hall_available_from.strftime('%d %B %Y, %H:%M')
                ev_data.append(['Hall Available From:', hall_str, '', ''])
            ev_table = Table(ev_data, colWidths=[80, 155, 75, 120])
            ev_table.setStyle(TableStyle([
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#888888')),
                ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#888888')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
                ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#333333')),
                ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
            ]))
            elems.append(ev_table)
            elems.append(Spacer(1, 6))

        # Services Table
        table_data = [['#', 'Service', 'Amount (€)']]
        for i, item in enumerate(items, 1):
            service_text = item.service.name
            if item.service.name == 'Special Requirement' and item.comment:
                # Replace the generic name with the actual requirement description
                service_text = item.comment
                
            service_col = Paragraph(service_text, ParagraphStyle('ServiceWrap', parent=styles['Normal'], fontSize=9, leading=11))
            table_data.append([str(i), service_col, f'€{item.quoted_amount:,.2f}'])

        if quote.travel_cost > 0:
            travel_col = Paragraph("Travel Expense", ParagraphStyle('ServiceWrap', parent=styles['Normal'], fontSize=9, leading=11))
            table_data.append([str(len(table_data)), travel_col, f'€{quote.travel_cost:,.2f}'])

        if quote.catering_cost and quote.catering_cost > 0:
            food_menu = None
            if quote.event:
                try:
                    food_menu = quote.event.food_menu
                except Exception:
                    food_menu = None
            wrap_style = ParagraphStyle('ServiceWrap', parent=styles['Normal'], fontSize=9, leading=11)
            if food_menu:
                items_extra = sum(float(it.amount) for it in food_menu.items.all() if it.amount is not None)
                base_catering = float(quote.catering_cost) - items_extra
                lines = [f'<font size="9">Catering</font>']
                if base_catering > 0:
                    lines.append(f'<font size="7" color="#888888">  {food_menu.adult_count} Adult(s) × €{float(food_menu.adult_rate):,.2f} + {food_menu.kid_count} Kid(s) × €{float(food_menu.kid_rate):,.2f}  →  €{base_catering:,.2f}</font>')
                for it in food_menu.items.all():
                    if it.amount is not None:
                        lines.append(f'<font size="7" color="#888888">  {it.name}: +€{float(it.amount):,.2f}</font>')
                catering_col = Paragraph('<br/>'.join(lines), wrap_style)
            else:
                catering_col = Paragraph('Catering', wrap_style)
            table_data.append([str(len(table_data)), catering_col, f'€{quote.catering_cost:,.2f}'])

        svc_table = Table(table_data, colWidths=[30, 310, 100])
        svc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#012d2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#333333')),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f8f8')]),
            ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#012d2d')),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.HexColor('#cccccc')),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#e0e0e0')),
        ]))
        elems.append(svc_table)
        elems.append(Spacer(1, 10))

        # Totals
        subtotal = quote.subtotal # subtotal already includes travel_cost
        discount_pct = quote.discount_percentage
        discount_amt = quote.discount_amount
        total = quote.total

        totals_data = [
            ['', 'Subtotal:', f'€{subtotal:,.2f}']
        ]
        
        if discount_pct > 0:
            totals_data.append(['', f'Discount ({discount_pct}%):', f'-€{discount_amt:,.2f}'])
            
        totals_data.append(['', 'Total:', f'€{total:,.2f}'])
        
        style = TableStyle([
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (1, 0), (-1, -1), colors.HexColor('#333333')),
            ('FONTNAME', (1, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (1, -1), (-1, -1), 12),
            ('TEXTCOLOR', (1, -1), (-1, -1), colors.HexColor('#012d2d')),
            ('LINEABOVE', (1, -1), (-1, -1), 1.5, colors.HexColor('#EEC059')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ])

        totals_table = Table(totals_data, colWidths=[240, 100, 100])
        totals_table.setStyle(style)
        elems.append(totals_table)

        # Notes
        if quote.notes:
            elems.append(Spacer(1, 12))
            elems.append(Paragraph('Notes', heading_style))
            elems.append(Paragraph(quote.notes.replace('\n', '<br/>'), normal_style))

        # Footer
        elems.append(Spacer(1, 30))
        elems.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#cccccc'), spaceAfter=8))
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#999999'), alignment=TA_CENTER)
        elems.append(Paragraph('CRYSTAL EVENTS | Ballinasloe, Galway, Ireland & Redhill, London, UK | info@crystaleventsie.com', footer_style))
        elems.append(Paragraph('Thank you for your interest. We look forward to making your event special!', footer_style))

        # Watermark drawing function
        def draw_watermark(canvas, doc):
            canvas.saveState()
            if colored_logo_buffer:
                from reportlab.lib.utils import ImageReader
                # Set opacity to 70% reduction visually (0.07 actual drawing alpha)
                canvas.setFillAlpha(0.07)
                # Calculate center position with a slight top padding offset as requested
                page_width, page_height = A4
                logo_width = 150*mm
                logo_height = 150*mm
                x = (page_width - logo_width) / 2
                y = ((page_height - logo_height) / 2) - (20*mm) # Moved slightly down visually giving it top padding
                colored_logo_buffer.seek(0)
                ir = ImageReader(colored_logo_buffer)
                canvas.drawImage(ir, x, y, width=logo_width, height=logo_height, mask='auto', preserveAspectRatio=True)
            canvas.restoreState()

        doc.build(elems, onFirstPage=draw_watermark, onLaterPages=draw_watermark)
        buf.seek(0)

        response = HttpResponse(buf.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Crystal_Events_Quote_{quote.id}.pdf"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related('service').all().order_by('-created_at')
    serializer_class = MessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_throttles(self):
        if self.action == 'create':
            throttle = ScopedRateThrottle()
            throttle.scope = 'contact'
            return [throttle]
        return []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            message = serializer.save()
        except Exception as e:
            logger.exception('Error creating contact message')
            return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        self._send_contact_emails(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _send_contact_emails(self, message):
        # 1. Confirmation to customer
        try:
            customer_body = (
                f"Hi {message.name},\n\n"
                f"Thank you for reaching out to Crystal Events! We have received your message regarding "
                f"'{message.service.name if message.service else 'General Inquiry'}' and will get back to you as soon as possible.\n\n"
                f"Your message:\n{message.message}\n\n"
                f"Best regards,\nThe Crystal Events Team"
            )
            send_mail(
                'We received your message - Crystal Events',
                customer_body,
                settings.DEFAULT_FROM_EMAIL,
                [message.email],
                fail_silently=True,
            )
            logger.info('[EMAIL] Customer confirmation sent.')
        except Exception as e:
            logger.error('[EMAIL ERROR] Customer confirmation failed: %s', e)

        # 2. Staff notification
        try:
            staff_body = (
                f"You have an enquiry from {message.name}.\n\n"
                f"Name: {message.name}\n"
                f"Email: {message.email}\n"
                f"Phone: {message.phone}\n"
                f"Service: {message.service.name if message.service else 'N/A'}\n\n"
                f"Message:\n{message.message}"
            )
            recipients = [settings.NOTIFY_EMAIL]
            for profile in UserProfile.objects.select_related('user').filter(email_notifications=True, user__is_active=True):
                if profile.user.email and profile.user.email not in recipients:
                    recipients.append(profile.user.email)
            send_mail(
                f'You have an enquiry from {message.name}',
                staff_body,
                settings.DEFAULT_FROM_EMAIL,
                recipients,
                fail_silently=True,
            )
            logger.info('[EMAIL] Staff notification sent.')
        except Exception as e:
            logger.error('[EMAIL ERROR] Staff notification failed: %s', e)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        message = self.get_object()
        reply_content = request.data.get('reply')
        
        if not reply_content:
            return Response({'error': 'Reply content is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.utils import timezone
            from django.core.mail import EmailMultiAlternatives

            now = timezone.now()
            sent_at_str = now.strftime('%d %B %Y at %H:%M')

            plain_body = (
                f"Dear {message.name},\n\n"
                f"{reply_content}\n\n"
                f"---\n"
                f"Crystal Events\n"
                f"This reply was sent on {sent_at_str}.\n"
                f"This is a reply to your original message: \"{message.message[:120]}{'...' if len(message.message) > 120 else ''}\""
            )

            html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0a2424;padding:24px 32px;">
            <h1 style="margin:0;color:#c9a84c;font-size:22px;letter-spacing:1px;">Crystal Events</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;color:#555;font-size:14px;">Dear <strong>{message.name}</strong>,</p>
            <div style="margin:24px 0;padding:20px 24px;background:#f9f9f9;border-left:4px solid #c9a84c;border-radius:4px;">
              <p style="margin:0;color:#222;font-size:15px;line-height:1.7;white-space:pre-wrap;">{reply_content}</p>
            </div>
            <p style="margin:24px 0 0;color:#999;font-size:12px;">
              Sent on {sent_at_str}<br>
              In reply to: <em style="color:#bbb;">"{message.message[:120]}{'...' if len(message.message) > 120 else ''}"</em>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f0f0f0;padding:16px 32px;border-top:1px solid #e0e0e0;">
            <p style="margin:0;color:#aaa;font-size:11px;text-align:center;">
              &copy; Crystal Events &bull; This email was sent in response to your enquiry.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

            email = EmailMultiAlternatives(
                subject='Re: Your message to Crystal Events',
                body=plain_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[message.email],
            )
            email.attach_alternative(html_body, 'text/html')
            email.send(fail_silently=False)

            message.status = 'replied'
            message.reply_text = reply_content
            message.replied_at = now
            if not isinstance(message.replies, list):
                message.replies = []
            sender_name = request.user.get_full_name() or request.user.username
            message.replies = message.replies + [{'text': reply_content, 'sent_at': now.isoformat(), 'replied_by': sender_name}]
            message.save()
            return Response({'status': 'Reply sent', 'sent_at': now.isoformat(), 'replied_by': sender_name})
        except Exception as e:
            logger.exception('Error sending reply')
            return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        message_ids = request.data.get('ids', [])
        if not message_ids or not isinstance(message_ids, list):
            return Response({'error': 'No message IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        if len(message_ids) > 100:
            return Response({'error': 'Maximum 100 items per request'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            safe_ids = [int(i) for i in message_ids]
        except (ValueError, TypeError):
            return Response({'error': 'Invalid ID format'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            Message.objects.filter(id__in=safe_ids).delete()
            return Response({'status': 'Messages deleted'})
        except Exception as e:
            logger.exception('Error in bulk_delete')
            return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── User Management Views ──────────────────────────────────────────

class CurrentUserView(generics.RetrieveAPIView):
    """Returns the profile of the currently authenticated user."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UpdateProfileView(generics.UpdateAPIView):
    """Allows users to update their own profile (except email)."""
    serializer_class = UpdateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        file = request.FILES.get('profile_picture')
        if file:
            err = _validate_upload(file)
            if err:
                return Response({'profile_picture': [err]}, status=status.HTTP_400_BAD_REQUEST)
        response = super().update(request, *args, **kwargs)
        if file:
            url = _cloudinary_upload(file, 'profile_pictures')
            if url:
                profile, _ = UserProfile.objects.get_or_create(user=request.user)
                profile.profile_picture_url = url
                profile.profile_picture = None
                profile.save(update_fields=['profile_picture_url', 'profile_picture'])
        return response


class UserListView(generics.ListAPIView):
    """Lists all staff users. Superuser only."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperUser]

    def get_queryset(self):
        return User.objects.filter(is_staff=True).select_related('profile').order_by('-date_joined')


class StaffPickerView(generics.ListAPIView):
    """Returns minimal user info (id + name) for dropdowns. Available to all authenticated staff."""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        users = User.objects.filter(is_staff=True, is_active=True).order_by('first_name', 'last_name')
        data = [
            {
                'id': u.id,
                'username': u.username,
                'first_name': u.first_name,
                'last_name': u.last_name,
            }
            for u in users
        ]
        return Response(data)


class CreateUserView(generics.CreateAPIView):
    """Creates a new staff user. Superuser only."""
    serializer_class = CreateUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    throttle_scope = 'user_create'

    def get_throttles(self):
        throttle = ScopedRateThrottle()
        throttle.scope = 'user_create'
        return [throttle]

    def perform_create(self, serializer):
        file = self.request.FILES.get('profile_picture')
        if file:
            err = _validate_upload(file)
            if err:
                raise serializers.ValidationError({'profile_picture': err})
        user = serializer.save()
        if file:
            url = _cloudinary_upload(file, 'profile_pictures')
            if url:
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.profile_picture_url = url
                profile.profile_picture = None
                profile.save(update_fields=['profile_picture_url', 'profile_picture'])


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Superuser can view, update, and delete any user by ID."""
    permission_classes = [permissions.IsAuthenticated, IsSuperUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = User.objects.all()
    lookup_field = 'pk'

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return AdminUpdateUserSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        file = request.FILES.get('profile_picture')
        if file:
            err = _validate_upload(file)
            if err:
                return Response({'profile_picture': [err]}, status=status.HTTP_400_BAD_REQUEST)
        response = super().update(request, *args, **kwargs)
        if file:
            url = _cloudinary_upload(file, 'profile_pictures')
            if url:
                user = self.get_object()
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.profile_picture_url = url
                profile.profile_picture = None
                profile.save(update_fields=['profile_picture_url', 'profile_picture'])
        return response

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

def _calculate_financials():
    """Shared profit calculation used by ProfitDistributionView and SplitProfitView."""
    from .models import Expense, Income, Event
    from decimal import Decimal
    from django.db.models import Sum

    manual_income = Income.objects.aggregate(total=Sum('amount'))['total'] or Decimal('0')
    event_income = Event.objects.aggregate(total=Sum('received_amount'))['total'] or Decimal('0')
    total_income = manual_income + event_income
    total_expense = Expense.objects.exclude(category__in=['Refund', 'Profit Payout', 'Tip Payout', 'Staff Party']).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    net_profit = total_income - total_expense
    return total_income, total_expense, net_profit


class ProfitDistributionView(APIView):
    """Returns total profit (income - expenses) and per-owner distribution."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from decimal import Decimal

        total_income, total_expense, net_profit = _calculate_financials()

        owners = User.objects.filter(profile__is_owner=True).select_related('profile')
        distribution = []
        for owner in owners:
            pct = owner.profile.profit_percentage or Decimal('0')
            share = (net_profit * pct / Decimal('100')).quantize(Decimal('0.01'))
            distribution.append({
                'id': owner.id,
                'name': f"{owner.first_name} {owner.last_name}".strip() or owner.username,
                'username': owner.username,
                'profit_percentage': float(pct),
                'share': float(share),
            })

        return Response({
            'total_income': float(total_income),
            'total_expense': float(total_expense),
            'net_profit': float(net_profit),
            'distribution': distribution,
        })


class SplitProfitView(APIView):
    """Creates Expense (Profit Payout) records for each owner based on their profit percentage."""
    permission_classes = [permissions.IsAuthenticated, IsSuperUser]

    def post(self, request):
        from .models import Expense
        from decimal import Decimal, InvalidOperation
        from django.utils import timezone

        amount_raw = request.data.get('amount')
        mark_as_paid = request.data.get('mark_as_paid', False)

        try:
            amount = Decimal(str(amount_raw)).quantize(Decimal('0.01'))
        except (InvalidOperation, TypeError):
            return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'error': 'Amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        _total_income, _total_expense, net_profit = _calculate_financials()

        if amount > net_profit:
            return Response({'error': f'Amount exceeds net profit of €{net_profit:.2f}.'}, status=status.HTTP_400_BAD_REQUEST)

        owners = User.objects.filter(profile__is_owner=True).select_related('profile')
        if not owners.exists():
            return Response({'error': 'No owners configured.'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        paid_back_at = timezone.now() if mark_as_paid else None
        reason = f'Profit Payout – {today.strftime("%d %b %Y")}'

        created = []
        for owner in owners:
            pct = owner.profile.profit_percentage or Decimal('0')
            share = (amount * pct / Decimal('100')).quantize(Decimal('0.01'))
            if share <= 0:
                continue
            exp = Expense.objects.create(
                date=today,
                amount=share,
                reason=reason,
                category='Profit Payout',
                approved_by=request.user,
                paid_by=owner,
                paid_back=bool(mark_as_paid),
                paid_back_at=paid_back_at,
            )
            created.append({
                'id': exp.id,
                'owner_id': owner.id,
                'owner_name': f"{owner.first_name} {owner.last_name}".strip() or owner.username,
                'amount': float(share),
                'paid_back': exp.paid_back,
            })

        return Response({'created': created, 'total_split': float(amount)}, status=status.HTTP_201_CREATED)


class TipDistributionView(APIView):
    """Returns tip entries per event, distribution history, balances, and staff list."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from decimal import Decimal
        from django.db.models import Sum
        from .models import Expense

        # Tip entries from events
        events_with_tips = Event.objects.filter(tip_amount__gt=0).order_by('-event_date')
        total_tips = events_with_tips.aggregate(total=Sum('tip_amount'))['total'] or Decimal('0')

        tip_entries = []
        for e in events_with_tips:
            # Find the date of the most recent tip log entry in the audit log
            tip_date = None
            for log in reversed(e.audit_log or []):
                if log.get('action') in ('tip_received', 'payment_received') and float(log.get('tip_received_now', 0)) > 0:
                    ts = log.get('timestamp', '')
                    if ts:
                        try:
                            from django.utils.dateparse import parse_datetime
                            dt = parse_datetime(ts)
                            if dt:
                                tip_date = dt.strftime('%d %b %Y')
                        except Exception:
                            pass
                    break
            tip_entries.append({
                'event_id': e.id,
                'event_uid': e.event_uid or f'CE-{e.id:05d}',
                'event_name': e.event_name,
                'tip_date': tip_date or e.event_date.strftime('%d %b %Y'),
                'tip_amount': float(e.tip_amount),
            })

        # Distribution history
        tip_expenses = (
            Expense.objects
            .filter(category__in=['Tip Payout', 'Staff Party'])
            .order_by('-date')
            .select_related('paid_by')
        )
        distributed_total = tip_expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        available_balance = total_tips - distributed_total

        distribution_entries = []
        for exp in tip_expenses:
            distribution_entries.append({
                'id': exp.id,
                'date': exp.date.strftime('%d %b %Y'),
                'reason': exp.reason,
                'category': exp.category,
                'amount': float(exp.amount),
                'paid_to': (
                    f"{exp.paid_by.first_name} {exp.paid_by.last_name}".strip() or exp.paid_by.username
                ) if exp.paid_by else None,
                'paid_back': exp.paid_back,
            })

        # Active staff for distribution modal
        staff = User.objects.filter(is_active=True).order_by('first_name', 'last_name')
        staff_list = [
            {
                'id': u.id,
                'name': f"{u.first_name} {u.last_name}".strip() or u.username,
                'username': u.username,
            }
            for u in staff
        ]

        return Response({
            'total_tips': float(total_tips),
            'distributed_total': float(distributed_total),
            'available_balance': float(available_balance),
            'tip_entries': tip_entries,
            'distribution_entries': distribution_entries,
            'staff_count': len(staff_list),
            'staff': staff_list,
        })


class SplitTipView(APIView):
    """Split collected tips equally among staff or as a single staff party expense."""
    permission_classes = [permissions.IsAuthenticated, IsStaffOrFinancials]

    def post(self, request):
        from .models import Expense
        from decimal import Decimal, InvalidOperation
        from django.db.models import Sum
        from django.utils import timezone

        amount_raw = request.data.get('amount')
        mode = request.data.get('mode', 'split')   # 'split' or 'party'
        mark_as_paid = request.data.get('mark_as_paid', False)

        try:
            amount = Decimal(str(amount_raw)).quantize(Decimal('0.01'))
        except (InvalidOperation, TypeError):
            return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'error': 'Amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        total_tips = Event.objects.aggregate(total=Sum('tip_amount'))['total'] or Decimal('0')
        if amount > total_tips:
            return Response({'error': f'Amount exceeds total tips of €{total_tips:.2f}.'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        paid_back_at = timezone.now() if mark_as_paid else None
        date_str = today.strftime('%d %b %Y')
        created = []

        if mode == 'party':
            exp = Expense.objects.create(
                date=today,
                amount=amount,
                reason=f'Staff Party / Get-together – {date_str}',
                category='Staff Party',
                approved_by=request.user,
                paid_back=bool(mark_as_paid),
                paid_back_at=paid_back_at,
            )
            created.append({'reason': exp.reason, 'amount': float(exp.amount)})
        else:
            selected_staff_ids = request.data.get('selected_staff_ids')
            if selected_staff_ids is not None:
                staff = User.objects.filter(is_active=True, id__in=selected_staff_ids)
            else:
                staff = User.objects.filter(is_active=True)
            staff_count = staff.count()
            if staff_count == 0:
                return Response({'error': 'No staff selected.'}, status=status.HTTP_400_BAD_REQUEST)
            share = (amount / staff_count).quantize(Decimal('0.01'))
            for u in staff:
                exp = Expense.objects.create(
                    date=today,
                    amount=share,
                    reason=f'Tip Share – {date_str}',
                    category='Tip Payout',
                    approved_by=request.user,
                    paid_by=u,
                    paid_back=bool(mark_as_paid),
                    paid_back_at=paid_back_at,
                )
                created.append({
                    'id': exp.id,
                    'user_name': f"{u.first_name} {u.last_name}".strip() or u.username,
                    'amount': float(share),
                })

        return Response({'created': created, 'total_split': float(amount), 'mode': mode}, status=status.HTTP_201_CREATED)


class TipEventClearView(APIView):
    """Zero out the tip_amount on a specific event."""
    permission_classes = [permissions.IsAuthenticated, IsStaffOrFinancials]

    def delete(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        event.tip_amount = 0
        event.save(update_fields=['tip_amount'])
        return Response({'ok': True}, status=status.HTTP_200_OK)


class TipExpenseActionView(APIView):
    """Delete or revert-paid on a tip expense (Tip Payout / Staff Party)."""
    permission_classes = [permissions.IsAuthenticated, IsStaffOrFinancials]

    def delete(self, request, pk):
        from .models import Expense
        try:
            exp = Expense.objects.get(pk=pk, category__in=['Tip Payout', 'Staff Party'])
        except Expense.DoesNotExist:
            return Response({'error': 'Tip expense not found.'}, status=status.HTTP_404_NOT_FOUND)
        exp.delete()
        return Response({'ok': True}, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        """Mark as paid or revert paid status on a tip expense."""
        from .models import Expense
        from django.utils import timezone
        try:
            exp = Expense.objects.get(pk=pk, category__in=['Tip Payout', 'Staff Party'])
        except Expense.DoesNotExist:
            return Response({'error': 'Tip expense not found.'}, status=status.HTTP_404_NOT_FOUND)
        action = request.data.get('action', 'revert')
        if action == 'mark_paid':
            exp.paid_back = True
            exp.paid_back_at = timezone.now()
        else:
            exp.paid_back = False
            exp.paid_back_at = None
        exp.save(update_fields=['paid_back', 'paid_back_at'])
        return Response({'ok': True}, status=status.HTTP_200_OK)


# ── Two-Factor Authentication Views ───────────────────────────────

import pyotp
import qrcode
import base64
from io import BytesIO
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view to check for 2FA requirement before issuing tokens."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_scope = 'login'
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get_throttles(self):
        throttle = ScopedRateThrottle()
        throttle.scope = 'login'
        return [throttle]

class TwoFactorLoginView(generics.GenericAPIView):
    """Endpoint for verifying OTP to complete login."""
    permission_classes = [permissions.AllowAny]
    serializer_class = TwoFactorLoginSerializer

    def get_throttles(self):
        throttle = ScopedRateThrottle()
        throttle.scope = 'login'
        return [throttle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class TwoFactorSetupView(generics.GenericAPIView):
    """Generates a new TOTP secret and returns a QR code URI."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        two_factor_auth, _ = TwoFactorAuth.objects.get_or_create(user=user)

        if two_factor_auth.is_enabled:
            return Response({'message': '2FA is already enabled.'}, status=status.HTTP_400_BAD_REQUEST)

        if not two_factor_auth.secret_key:
            secret_key = pyotp.random_base32()
            two_factor_auth.secret_key = secret_key
            two_factor_auth.save()
        else:
            secret_key = two_factor_auth.secret_key

        totp = pyotp.TOTP(secret_key)
        provisioning_uri = totp.provisioning_uri(name=user.email or user.username, issuer_name="Crystal Events")
        # 2FA secret must never be logged

        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return Response({
            'qr_code': f"data:image/png;base64,{qr_base64}",
            'secret': secret_key
        })

class TwoFactorVerifySetupView(generics.GenericAPIView):
    """Verifies the first OTP to properly activate and enable 2FA."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        otp = request.data.get('otp')
        if not otp:
            return Response({'error': 'OTP is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        try:
            two_factor_auth = user.two_factor_auth
        except TwoFactorAuth.DoesNotExist:
            return Response({'error': '2FA setup not initiated.'}, status=status.HTTP_400_BAD_REQUEST)

        if two_factor_auth.is_enabled:
            return Response({'message': '2FA is already enabled.'}, status=status.HTTP_400_BAD_REQUEST)

        if not two_factor_auth.secret_key:
            return Response({'error': '2FA setup not initialized.'}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(two_factor_auth.secret_key)
        
        if totp.verify(str(otp).strip(), valid_window=2):
            two_factor_auth.is_enabled = True
            two_factor_auth.save()
            return Response({'message': '2FA has been successfully setup and enabled.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid OTP code. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

class TwoFactorDisableView(generics.GenericAPIView):
    """Disables 2FA for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        try:
            two_factor_auth = user.two_factor_auth
            if not two_factor_auth.is_enabled:
                return Response({'message': '2FA is not currently enabled.'}, status=status.HTTP_400_BAD_REQUEST)
            two_factor_auth.is_enabled = False
            two_factor_auth.secret_key = None
            two_factor_auth.save()
            return Response({'message': '2FA disabled successfully.'}, status=status.HTTP_200_OK)
        except TwoFactorAuth.DoesNotExist:
            return Response({'message': '2FA is not currently enabled.'}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Always return 200 to prevent email enumeration
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'message': 'If that email is registered, a reset link has been sent.'})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        is_prod = not settings.DEBUG
        base_url = 'https://crystaleventsie.com' if is_prod else 'http://localhost:5173'
        reset_url = f'{base_url}/admin/reset-password/{uid}/{token}'

        send_mail(
            subject='Reset Your Crystal Events Password',
            message=(
                f'Hi {user.first_name or user.username},\n\n'
                f'You requested a password reset. Click the link below to set a new password:\n\n'
                f'{reset_url}\n\n'
                f'This link expires in 1 hour. If you did not request this, ignore this email.\n\n'
                f'— Crystal Events'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({'message': 'If that email is registered, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str

        uid = request.data.get('uid', '').strip()
        token = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not all([uid, token, new_password, confirm_password]):
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 10:
            return Response({'error': 'Password must be at least 10 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password has been reset successfully.'})


class FoodMenuViewSet(viewsets.ModelViewSet):
    queryset = FoodMenu.objects.select_related('event').prefetch_related('items').all()
    serializer_class = FoodMenuSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrFinancials]

    def _user_display(self, user):
        if not user or not user.is_authenticated:
            return 'Unknown'
        full = f"{user.first_name} {user.last_name}".strip()
        return full or user.username

    def _log_menu_action(self, menu, action, user, old_menu_data=None):
        from django.utils import timezone
        event = menu.event
        if not event:
            return
        current_items = [
            {'name': item.name, 'amount': str(item.amount) if item.amount is not None else None}
            for item in menu.items.all()
        ]
        log_entry = {
            'timestamp': timezone.now().isoformat(),
            'action': action,
            'user': self._user_display(user),
            'menu': {
                'adult_count': menu.adult_count,
                'adult_rate': str(menu.adult_rate),
                'kid_count': menu.kid_count,
                'kid_rate': str(menu.kid_rate),
                'total_cost': str(menu.total_cost),
                'items': current_items,
            }
        }
        if action == 'menu_updated' and old_menu_data:
            changes = {}
            simple_fields = [
                ('Adults', str(old_menu_data.get('adult_count')), str(menu.adult_count)),
                ('Adult Rate', str(old_menu_data.get('adult_rate')), str(menu.adult_rate)),
                ('Kids', str(old_menu_data.get('kid_count')), str(menu.kid_count)),
                ('Kid Rate', str(old_menu_data.get('kid_rate')), str(menu.kid_rate)),
            ]
            for label, old_val, new_val in simple_fields:
                if old_val != new_val:
                    changes[label] = {'old': old_val, 'new': new_val}
            old_items = old_menu_data.get('items', [])
            if old_items != current_items:
                changes['items'] = {'old': old_items, 'new': current_items}
            if changes:
                log_entry['changes'] = changes
        log = list(event.audit_log or [])
        log.append(log_entry)
        event.audit_log = log
        event.save(update_fields=['audit_log'])

    def _sync_quote_catering(self, menu):
        """Update catering_cost on all quotes linked to this event, then sync event.budget."""
        event = menu.event
        if not event:
            return
        total = menu.total_cost
        event.quotes.all().update(catering_cost=total)

        # Recalculate event.budget from the best quote (accepted first, otherwise most recent)
        quote = (
            event.quotes.filter(status='accepted').order_by('-created_at').first()
            or event.quotes.order_by('-created_at').first()
        )
        if quote:
            # Fetch fresh from DB so catering_cost reflects the bulk update above
            quote.refresh_from_db()
            event.budget = quote.total
            event.save(update_fields=['budget'])

    def perform_create(self, serializer):
        menu = serializer.save()
        self._sync_quote_catering(menu)
        self._log_menu_action(menu, 'menu_added', self.request.user)

    def perform_update(self, serializer):
        old_menu = self.get_object()
        old_menu_data = {
            'adult_count': old_menu.adult_count,
            'adult_rate': old_menu.adult_rate,
            'kid_count': old_menu.kid_count,
            'kid_rate': old_menu.kid_rate,
            'items': [
                {'name': item.name, 'amount': str(item.amount) if item.amount is not None else None}
                for item in old_menu.items.all()
            ],
        }
        menu = serializer.save()
        self._sync_quote_catering(menu)
        self._log_menu_action(menu, 'menu_updated', self.request.user, old_menu_data)

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        import io
        import os
        from django.conf import settings
        from django.http import HttpResponse, HttpResponseForbidden
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER
        from PIL import Image as PilImage

        menu = self.get_object()
        event = menu.event

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=20*mm, leftMargin=20*mm,
            topMargin=20*mm, bottomMargin=20*mm
        )
        styles = getSampleStyleSheet()
        elems = []

        title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=24, textColor=colors.HexColor('#012d2d'), alignment=0, spaceAfter=8)
        subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=colors.HexColor('#666666'), alignment=0, spaceAfter=4)
        heading_style = ParagraphStyle('Head', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor('#012d2d'), spaceAfter=10, spaceBefore=20)

        # Header
        base_dir = settings.BASE_DIR
        logo_path = os.path.join(base_dir.parent, 'frontend', 'src', 'assets', 'images', 'logo.png')
        colored_logo_buffer = None
        if os.path.exists(logo_path):
            try:
                img = PilImage.open(logo_path).convert('RGBA')
                alpha = img.split()[-1]
                solid_color = PilImage.new('RGBA', img.size, (1, 45, 45, 255))
                colored_logo = PilImage.composite(solid_color, PilImage.new('RGBA', img.size, (255, 255, 255, 0)), alpha)
                colored_logo_buffer = io.BytesIO()
                colored_logo.save(colored_logo_buffer, format='PNG')
                colored_logo_buffer.seek(0)
            except Exception as e:
                pass

        brand_title = '<font name="Times-Bold" color="#012d2d" size="24">CRYSTAL </font><font name="Times-Roman" color="#012d2d" size="24">EVENTS</font>'
        if colored_logo_buffer:
            colored_logo_buffer.seek(0)
            logo = Image(colored_logo_buffer, width=25*mm, height=25*mm)
            header_table = Table([[logo, [Paragraph(brand_title, title_style), Spacer(1, 4), Paragraph('Ballinasloe, Galway, Ireland | Redhill, London, UK', subtitle_style), Paragraph('info@crystaleventsie.com', subtitle_style)]]], colWidths=[35*mm, 150*mm])
            header_table.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'LEFT'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('BOTTOMPADDING', (0, 0), (-1, -1), 10)]))
            elems.append(header_table)
        else:
            elems.append(Paragraph(brand_title, title_style))

        elems.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#EEC059'), spaceAfter=20, spaceBefore=5))

        # Title
        elems.append(Paragraph('Catering & Food Menu', ParagraphStyle('ReportTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, textColor=colors.HexColor('#012d2d'), alignment=TA_CENTER, spaceAfter=20)))

        # Event details
        ev_data = [
            ['Event:', event.event_name or '—', 'Date:', event.event_date.strftime('%d %B %Y') if event.event_date else '—'],
            ['Client:', event.client_name or '—', 'Venue:', event.venue or '—']
        ]
        ev_table = Table(ev_data, colWidths=[30*mm, 70*mm, 30*mm, 50*mm])
        ev_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
        ]))
        elems.append(ev_table)
        elems.append(Spacer(1, 15))

        # Items
        elems.append(Paragraph('Menu Selection', heading_style))
        item_data = [['Item Name']]
        for item in menu.items.all():
            item_data.append([item.name])
        
        if len(item_data) == 1:
            item_data.append(['No items specified.'])

        item_table = Table(item_data, colWidths=[180*mm])
        item_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#012d2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9f9f9')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ]))
        elems.append(item_table)
        elems.append(Spacer(1, 20))

        # Rates
        elems.append(Paragraph('Catering Breakdown', heading_style))
        rate_data = [
            ['Category', 'Count', 'Rate', 'Total'],
            ['Adults', str(menu.adult_count), f'€{menu.adult_rate:,.2f}', f'€{(menu.adult_count * menu.adult_rate):,.2f}'],
            ['Kids', str(menu.kid_count), f'€{menu.kid_rate:,.2f}', f'€{(menu.kid_count * menu.kid_rate):,.2f}'],
            ['', '', 'Total Cost:', f'€{menu.total_cost:,.2f}']
        ]

        rate_table = Table(rate_data, colWidths=[60*mm, 30*mm, 40*mm, 50*mm])
        rate_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#012d2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (2, -1), (3, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor('#dddddd')),
            ('LINEABOVE', (2, -1), (3, -1), 1.5, colors.HexColor('#012d2d')),
        ]))
        elems.append(rate_table)

        doc.build(elems)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f"FoodMenu_{event.event_name.replace(' ', '_')}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
