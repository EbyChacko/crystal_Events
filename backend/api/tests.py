from html import escape
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Message


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    NOTIFY_EMAIL='info@crystaleventsie.com',
    SECURE_SSL_REDIRECT=False,
)
class ContactEmailTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.payload = {
            'name': 'Customer',
            'email': 'customer@example.com',
            'phone': '0123456789',
            'message': 'Please help plan our event.',
        }

    def add_user(self, username, email, *, active=True, notifications=True):
        user = User.objects.create_user(username=username, email=email, is_active=active)
        user.profile.email_notifications = notifications
        user.profile.save()
        return user

    def test_contact_notification_hides_team_addresses_and_keeps_confirmation_private(self):
        self.add_user('staff1', 'staff1@example.com')
        self.add_user('staff2', 'staff2@example.com')
        self.add_user('duplicate', 'STAFF1@example.com')
        self.add_user('info', 'INFO@crystaleventsie.com')
        self.add_user('inactive', 'inactive@example.com', active=False)
        self.add_user('optedout', 'optedout@example.com', notifications=False)
        self.add_user('blank', '')

        response = self.client.post(reverse('message-list'), self.payload, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 2)
        confirmation, notification = mail.outbox
        self.assertEqual(confirmation.to, [self.payload['email']])
        self.assertEqual(confirmation.cc, [])
        self.assertEqual(confirmation.bcc, [])
        self.assertIn(self.payload['message'], confirmation.body)
        self.assertEqual(notification.to, ['info@crystaleventsie.com'])
        self.assertEqual(notification.cc, [])
        self.assertCountEqual(notification.bcc, ['staff1@example.com', 'staff2@example.com'])
        self.assertCountEqual(notification.recipients(), [
            'info@crystaleventsie.com', 'staff1@example.com', 'staff2@example.com',
        ])
        # SMTP envelope includes BCC recipients, but transmitted MIME headers do not.
        mime = notification.message()
        self.assertEqual(str(mime['To']), 'info@crystaleventsie.com')
        self.assertIsNone(mime['Cc'])
        self.assertIsNone(mime['Bcc'])
        for address in notification.bcc:
            self.assertNotIn(address, mime.as_string())

    def test_contact_notification_still_sends_when_no_team_addresses_are_available(self):
        response = self.client.post(reverse('message-list'), self.payload, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[1].to, ['info@crystaleventsie.com'])
        self.assertEqual(mail.outbox[1].bcc, [])

    def test_invalid_contact_does_not_send_email(self):
        self.payload['email'] = 'not-an-email'
        response = self.client.post(reverse('message-list'), self.payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Message.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_reply_escapes_html_fields_without_changing_plain_text_or_history(self):
        user = self.add_user('admin', 'admin@example.com')
        self.client.force_authenticate(user)
        name = '<img src=x onerror=alert(1)> & "Guest"'
        original = '<a href="https://example.com">Original & enquiry</a>' + 'x' * 150
        reply = '<script>alert("reply")</script>\nThanks & welcome, O\'Brien!'
        message = Message.objects.create(name=name, email=self.payload['email'], message=original)

        response = self.client.post(reverse('message-reply', args=[message.pk]), {'reply': reply}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.to, [self.payload['email']])
        self.assertEqual(email.cc, [])
        self.assertEqual(email.bcc, [])
        self.assertIn(name, email.body)
        self.assertIn(reply, email.body)
        self.assertIn(original[:120] + '...', email.body)
        html, mimetype = email.alternatives[0]
        self.assertEqual(mimetype, 'text/html')
        for raw, rendered in [(name, escape(name)), (reply, escape(reply)),
                              (original[:120], escape(original[:120]) + '...')]:
            self.assertNotIn(raw, html)
            self.assertIn(rendered, html)
        message.refresh_from_db()
        self.assertEqual(message.status, 'replied')
        self.assertEqual(message.reply_text, reply)
        self.assertEqual(message.replies[0]['text'], reply)
        self.assertEqual(message.replies[0]['replied_by'], user.username)
        self.assertIsNotNone(message.replied_at)

    def test_reply_requires_authentication(self):
        message = Message.objects.create(**self.payload)
        response = self.client.post(reverse('message-reply', args=[message.pk]), {'reply': 'Hello'}, format='json')

        self.assertEqual(response.status_code, 401)
        self.assertEqual(len(mail.outbox), 0)

    def test_empty_reply_does_not_send_email_or_change_message(self):
        self.client.force_authenticate(self.add_user('admin', 'admin@example.com'))
        message = Message.objects.create(**self.payload)
        response = self.client.post(reverse('message-reply', args=[message.pk]), {'reply': ''}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        message.refresh_from_db()
        self.assertEqual(message.status, 'unread')

    @patch('django.core.mail.EmailMultiAlternatives.send', side_effect=RuntimeError('Test delivery failure'))
    def test_failed_reply_does_not_record_a_successful_reply(self, send):
        self.client.force_authenticate(self.add_user('admin', 'admin@example.com'))
        message = Message.objects.create(**self.payload)
        with self.assertLogs('api', level='ERROR'):
            response = self.client.post(reverse('message-reply', args=[message.pk]), {'reply': 'Hello'}, format='json')

        self.assertEqual(response.status_code, 500)
        message.refresh_from_db()
        self.assertEqual(message.status, 'unread')
        self.assertEqual(message.reply_text, '')
        self.assertEqual(message.replies, [])
        self.assertIsNone(message.replied_at)
