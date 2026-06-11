#!/usr/bin/env bash
set -o errexit

# Run migrations at startup (DB network not available at build time on Render)
python manage.py migrate

# Start the application server
# --timeout 120   : allow 120s for Neon DB cold-start (default 30s is too short)
# --preload       : load Django once in master before forking workers (saves RAM, catches import errors early)
# --workers 1     : single worker on free tier (avoids OOM from multiple workers)
# --bind          : explicit bind so Render's port scanner always finds us
gunicorn crystal_events_backend.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --timeout 120 \
  --preload \
  --workers 1
