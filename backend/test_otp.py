import sys
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crystal_events_backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
import pyotp

user = User.objects.first()
print(f"User: {user.username}")
try:
    auth = user.two_factor_auth
    print(f"2FA enabled: {auth.is_enabled}")
    if auth.secret_key:
        print(f"Secret: {auth.secret_key}")
        totp = pyotp.TOTP(auth.secret_key)
        print("Current OTP window 0:", totp.now())
    else:
        print("No secret key.")
except ObjectDoesNotExist:
    print("No 2FA configured.")
