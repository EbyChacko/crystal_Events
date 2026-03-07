import sys
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crystal_events_backend.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
import pyotp

user = User.objects.first()
print(f"Testing with user: {user.username}")

client = APIClient(SERVER_NAME='localhost')
client.force_authenticate(user=user)

# Disable 2FA
try:
    resp = client.post('/api/auth/2fa/disable/')
    print("Disable 2FA:", resp.status_code, getattr(resp, 'data', ''))
except Exception as e:
    print("Disable 2FA failed:", e)

# Setup 2FA
resp = client.get('/api/auth/2fa/setup/')
print("Setup 2FA:", resp.status_code)
if resp.status_code == 200:
    secret = resp.data.get('secret')
    print("Secret received:", secret)
    
    # Generate OTP
    totp = pyotp.TOTP(secret)
    otp_code = str(totp.now())
    print("Generated OTP:", otp_code)
    
    # Verify Setup
    resp = client.post('/api/auth/2fa/verify-setup/', {'otp': otp_code}, format='json')
    print("Verify 2FA:", resp.status_code, resp.data)
else:
    print("Failed to setup 2FA:", resp.data)
