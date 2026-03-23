"""
Email test script for Crystal Events.
Run with: python3 test_email.py
"""
import os
import sys
import smtplib
import ssl
from dotenv import load_dotenv

load_dotenv()

HOST = os.environ.get("EMAIL_HOST", "send.one.com")
PORT = int(os.environ.get("EMAIL_PORT", "465"))
USER = os.environ.get("EMAIL_HOST_USER", "info@crystaleventsie.com")
PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
USE_SSL = os.environ.get("EMAIL_USE_SSL", "True") == "True"
FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", USER)

# Allow overriding recipient via command line: python3 test_email.py recipient@example.com
RECIPIENT = sys.argv[1] if len(sys.argv) > 1 else USER

print("=" * 50)
print("Crystal Events — Email Configuration Test")
print("=" * 50)
print(f"  HOST     : {HOST}")
print(f"  PORT     : {PORT}")
print(f"  USER     : {USER}")
print(f"  PASSWORD : {'SET ✓' if PASSWORD else 'MISSING ✗'}")
print(f"  USE_SSL  : {USE_SSL}")
print(f"  FROM     : {FROM_EMAIL}")
print(f"  TO       : {RECIPIENT}")
print("=" * 50)

if not PASSWORD:
    print("\n[FAIL] EMAIL_HOST_PASSWORD is not set.")
    print("  → Add it to your .env file or Render environment variables.")
    sys.exit(1)

print("\n[1/3] Connecting to SMTP server...")
try:
    context = ssl.create_default_context()
    server = smtplib.SMTP_SSL(HOST, PORT, context=context, timeout=10)
    print("  → Connected ✓")
except Exception as e:
    print(f"  → FAILED: {type(e).__name__}: {e}")
    sys.exit(1)

print("[2/3] Logging in...")
try:
    server.login(USER, PASSWORD)
    print("  → Authenticated ✓")
except smtplib.SMTPAuthenticationError as e:
    print(f"  → AUTH FAILED: Wrong username or password. ({e})")
    server.quit()
    sys.exit(1)
except Exception as e:
    print(f"  → FAILED: {type(e).__name__}: {e}")
    server.quit()
    sys.exit(1)

print(f"[3/3] Sending test email to {RECIPIENT}...")
try:
    message = f"""\
From: {FROM_EMAIL}
To: {RECIPIENT}
Subject: Crystal Events — Email Test

This is a test email sent from the Crystal Events email test script.
If you received this, your email setup is working correctly.
"""
    server.sendmail(FROM_EMAIL, [RECIPIENT], message)
    server.quit()
    print("  → Sent ✓")
except Exception as e:
    print(f"  → SEND FAILED: {type(e).__name__}: {e}")
    server.quit()
    sys.exit(1)

print("\n[ALL TESTS PASSED] Email is working correctly.")
