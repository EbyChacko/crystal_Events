import sys
import os
import django
import pyotp
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crystal_events_backend.settings')
django.setup()

from django.contrib.auth.models import User

try:
    user = User.objects.get(username="Eby")
    secret = user.two_factor_auth.secret_key
    print(f"User: {user.username}")
    print(f"Secret: {secret}")
    
    totp = pyotp.TOTP(secret)
    print(f"Server time: {datetime.now()}")
    print(f"Current OTP: {totp.now()}")
    print(f"Provisioning URI: {totp.provisioning_uri(name=user.username, issuer_name='Crystal Events')}")
    
except Exception as e:
    print(f"Error: {e}")
