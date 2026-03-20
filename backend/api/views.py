from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from .serializers import (
    ServiceSerializer, EventSerializer, ExpenseSerializer, IncomeSerializer,
    QuoteSerializer, MessageSerializer, UserSerializer,
    CreateUserSerializer, UpdateProfileSerializer, AdminUpdateUserSerializer,
    EventImageSerializer, TeamMemberSerializer, TravelRateSerializer,
    TwoFactorLoginSerializer, CustomTokenObtainPairSerializer
)
from .models import Service, Event, Expense, Income, Quote, Message, EventImage, TeamMember, TravelRate, TwoFactorAuth, FoodMenu, FoodMenuItem
from .serializers import FoodMenuSerializer


class IsSuperUser(permissions.BasePermission):
    """Only allows access to superusers."""
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TravelRateViewSet(viewsets.ModelViewSet):
    queryset = TravelRate.objects.all()
    serializer_class = TravelRateSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsSuperUser()]

class IncomeViewSet(viewsets.ModelViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        from django.utils import timezone
        # Auto-update status to in_progress if event_date has passed
        Event.objects.filter(status='confirmed', event_date__lte=timezone.now()).update(status='in_progress')
        return super().get_queryset()

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
                print(f"Error sending booking confirmation: {e}")

    def perform_update(self, serializer):
        user = self.request.user
        
        # Capture old state entirely for diffing
        old_instance = serializer.instance
        old_snapshot = self._build_snapshot(old_instance)
        
        old_received = old_instance.received_amount or 0
        old_discount = old_instance.payment_discount or 0
        
        event = serializer.save()
        
        new_received = event.received_amount or 0
        new_discount = event.payment_discount or 0
        
        current_log = list(event.audit_log or [])
        
        # Check if this was purely a payment update (to separate payment logs from data updates)
        if new_received > old_received or new_discount > old_discount:
            amount_now = new_received - old_received
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
            
            log_entry = {
                'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
                'action': 'payment_received',
                'user': self._user_display(user),
                'amount_received_now': str(amount_now),
                'total_amount_received': str(new_received),
                'quoted_amount': str(budget),
                'discount': str(discount),
                'remaining_balance': str(remaining),
                'quote_items_snapshot': quote_snapshot
            }
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
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

        token_str = request.query_params.get('token')
        if token_str:
            try:
                jwt_auth = JWTAuthentication()
                validated = jwt_auth.get_validated_token(token_str)
                request.user = jwt_auth.get_user(validated)
            except (InvalidToken, TokenError):
                return HttpResponseForbidden('Invalid token')

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
                print(f"Error processing logo: {e}")

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
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

        # ── Auth ──────────────────────────────────────────────────────────
        token_str = request.query_params.get('token')
        if token_str:
            try:
                jwt_auth = JWTAuthentication()
                validated = jwt_auth.get_validated_token(token_str)
                request.user = jwt_auth.get_user(validated)
            except (InvalidToken, TokenError):
                return HttpResponseForbidden('Invalid token')

        if not request.user or not request.user.is_authenticated:
            return HttpResponseForbidden('Authentication required')
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
                print(f'Error processing logo: {e}')

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

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.AllowAny]


class EventImageViewSet(viewsets.ModelViewSet):
    queryset = EventImage.objects.all()
    serializer_class = EventImageSerializer
    permission_classes = [permissions.AllowAny]


class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['post'])
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
    permission_classes = [permissions.AllowAny]

    def _log_quote_action(self, quote, action, user):
        """Append a quote-related entry to the linked event's audit log."""
        if not quote.event:
            return
        event = quote.event
        from django.utils import timezone
        entry = {
            'timestamp': timezone.now().isoformat(),
            'action': action,
            'user': f"{user.first_name} {user.last_name}".strip() or user.username,
            'quote_id': quote.id,
            'quote_subtotal': str(quote.subtotal),
            'quote_discount': str(quote.discount_amount),
            'quote_total': str(quote.total),
            'quote_status': quote.get_status_display(),
            'services_detail': [
                {
                    'name': item.service.name,
                    'amount': str(item.quoted_amount),
                    'description': item.comment or ''
                } for item in quote.items.select_related('service').all()
            ],
            'services': [item.service.name for item in quote.items.select_related('service').all()],
        }
        
        if quote.travel_cost and quote.travel_cost > 0:
            entry['services_detail'].append({
                'name': 'Travel Expense',
                'amount': str(quote.travel_cost),
                'description': 'Calculated based on distance'
            })
            entry['services'].append('Travel Expense')

        log = list(event.audit_log or [])
        log.append(entry)
        event.audit_log = log
        event.save(update_fields=['audit_log'])

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
            
        self._log_quote_action(quote, 'quote_created', self.request.user)

    def perform_update(self, serializer):
        quote = serializer.save()
        if quote.event:
            event = quote.event
            event.budget = quote.total
            
            update_fields = ['budget']
            if quote.status == 'accepted' and event.status != 'confirmed':
                event.status = 'confirmed'
                update_fields.append('status')
            
            event.save(update_fields=update_fields)
            
        self._log_quote_action(quote, 'quote_updated', self.request.user)

    @action(detail=True, methods=['get'], url_path='pdf')
    def generate_pdf(self, request, pk=None):
        # Allow token via query string so window.open() works
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        token_str = request.query_params.get('token')
        if token_str:
            try:
                jwt_auth = JWTAuthentication()
                validated = jwt_auth.get_validated_token(token_str)
                request.user = jwt_auth.get_user(validated)
            except (InvalidToken, TokenError):
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden('Invalid token')

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
                print(f"Failed to colorize logo: {e}")
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
            table_data.append([str(len(items) + 1), travel_col, f'€{quote.travel_cost:,.2f}'])

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
    queryset = Message.objects.all().order_by('-created_at')
    serializer_class = MessageSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        message = serializer.save()
        
        # 1. Send confirmation to Customer
        try:
            customer_subject = 'We received your message - Crystal Events'
            customer_body = f"Hi {message.name},\n\nThank you for reaching out to Crystal Events! We have received your message regarding '{message.service.name if message.service else 'General Inquiry'}' and will get back to you as soon as possible.\n\nYour message:\n{message.message}\n\nBest regards,\nThe Crystal Events Team"
            
            send_mail(
                customer_subject,
                customer_body,
                settings.DEFAULT_FROM_EMAIL,
                [message.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending customer confirmation: {e}")

        # 2. Notify info@crystaleventsie.com and Staff members
        try:
            staff_subject = f'New Website Message: {message.name}'
            staff_body = (
                f"You have received a new message from the website contact form.\n\n"
                f"Name: {message.name}\n"
                f"Email: {message.email}\n"
                f"Phone: {message.phone}\n"
                f"Service: {message.service.name if message.service else 'N/A'}\n\n"
                f"Message:\n{message.message}\n\n"
                f"View in Admin: {settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else ''}/admin/messages"
            )

            # Collect recipients: always include info@ and then add staff who enabled notifications
            recipients = [settings.NOTIFY_EMAIL]
            
            # Fan-out to staff
            staff_profiles = UserProfile.objects.filter(email_notifications=True, user__is_active=True)
            for profile in staff_profiles:
                if profile.user.email and profile.user.email not in recipients:
                    recipients.append(profile.user.email)

            send_mail(
                staff_subject,
                staff_body,
                settings.DEFAULT_FROM_EMAIL,
                recipients,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending staff notifications: {e}")

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        message = self.get_object()
        reply_content = request.data.get('reply')
        
        if not reply_content:
            return Response({'error': 'Reply content is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.utils import timezone
            send_mail(
                f'Re: Your message to Crystal Events',
                reply_content,
                settings.DEFAULT_FROM_EMAIL,
                [message.email],
                fail_silently=False,
            )
            message.status = 'replied'
            message.reply_text = reply_content
            message.replied_at = timezone.now()
            message.save()
            return Response({'status': 'Reply sent'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        message_ids = request.data.get('ids', [])
        if not message_ids:
            return Response({'error': 'No message IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            Message.objects.filter(id__in=message_ids).delete()
            return Response({'status': 'Messages deleted'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """Lists all staff users. Superuser only."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperUser]

    def get_queryset(self):
        return User.objects.filter(is_staff=True).order_by('-date_joined')


class CreateUserView(generics.CreateAPIView):
    """Creates a new staff user. Superuser only."""
    serializer_class = CreateUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


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

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

# ── Two-Factor Authentication Views ───────────────────────────────

import pyotp
import qrcode
import base64
from io import BytesIO
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view to check for 2FA requirement before issuing tokens."""
    serializer_class = CustomTokenObtainPairSerializer

class TwoFactorLoginView(generics.GenericAPIView):
    """Endpoint for verifying OTP to complete login."""
    permission_classes = [permissions.AllowAny]
    serializer_class = TwoFactorLoginSerializer

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
        print(f"--- 2FA SETUP GENERATING NEW QR ---")
        print(f"Secret: {secret_key}")
        print(f"URI: {provisioning_uri}")
        print(f"-----------------------------------")

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
        
        # Verify result with a larger window to tolerate minor time drift on test machines
        if totp.verify(str(otp).strip(), valid_window=6):
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

class FoodMenuViewSet(viewsets.ModelViewSet):
    queryset = FoodMenu.objects.all()
    serializer_class = FoodMenuSerializer
    def get_permissions(self):
        if self.action == 'pdf':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        # Allow token via query string so window.open() works
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        token_str = request.query_params.get('token')
        if token_str:
            try:
                jwt_auth = JWTAuthentication()
                validated = jwt_auth.get_validated_token(token_str)
                request.user = jwt_auth.get_user(validated)
            except (InvalidToken, TokenError):
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden('Invalid token')

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

        # Optional Token Auth for direct browser download
        token_str = request.query_params.get('token')
        if token_str:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
            try:
                jwt_auth = JWTAuthentication()
                validated = jwt_auth.get_validated_token(token_str)
                request.user = jwt_auth.get_user(validated)
            except (InvalidToken, TokenError):
                return HttpResponseForbidden('Invalid token')

        if not request.user or not request.user.is_authenticated:
            return HttpResponseForbidden('Authentication required')

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
