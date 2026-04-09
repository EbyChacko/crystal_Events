#!/usr/bin/env bash
set -o errexit

# Run migrations at startup (requires network — not available at build time)
python manage.py migrate

# Start the application server
gunicorn crystal_events_backend.wsgi:application
