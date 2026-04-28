#!/usr/bin/env bash
set -o errexit

# Run migrations at startup (DB network not available at build time on Render)
python manage.py migrate

# Start the application server
gunicorn crystal_events_backend.wsgi:application
