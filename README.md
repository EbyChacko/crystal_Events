# Crystal Events — Event Management Platform

A full-stack web application for **Crystal Events Ireland**, a premium event management company based in Ballinasloe, Galway. The platform serves two audiences: a public-facing marketing website for clients, and a private admin panel for the Crystal Events team to manage events, finances, quotes, and more.

---

## Live Site

**[crystaleventsie.com](https://crystaleventsie.com)**

---

## What This Project Does

### Public Website
The marketing site showcases Crystal Events' services and allows potential clients to get in touch:

- **Home** — hero section, featured services, team highlights, testimonials, and service coverage areas across Ireland
- **Services** — overview of all event packages with individual detail pages:
  - Wedding Planning
  - Birthday Events
  - Corporate Events
  - Stage Decoration
  - DJ, Live Music & Sound
  - Catering Services
- **About Us** — company story, mission, team, and client testimonials
- **Gallery** — curated photo showcase of past events
- **Contact** — enquiry form that sends messages directly to the admin inbox

### Admin Panel (`/admin`)
A password-protected dashboard for the Crystal Events team with full business management capabilities:

| Section | What It Does |
|---|---|
| **Dashboard** | Overview of upcoming events, recent messages, and key stats |
| **Events** | Create, manage, and track all events from enquiry to completion |
| **Calendar** | Visual month/week calendar of all scheduled events |
| **Messages** | View and reply to client enquiries from the contact form |
| **Quotes** | Build and send itemised quotes with service line items, travel costs, discounts |
| **Financials** | Track income, expenses, payments received, and profit per event |
| **Staff Finance** | Per-staff expense tracking with paid-back status |
| **Assets** | Track company equipment and assets with current valuations |
| **Services** | Manage the services listed on the public website |
| **Team** | Manage team member profiles shown on the About page |
| **Travel Rates** | Configure distance-based travel cost rates |
| **Users** | Superuser-only user management |
| **Settings** | Account settings with 2FA (TOTP) support |
| **Profile** | Personal profile with photo upload |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [React 18](https://react.dev) | UI framework |
| [Vite](https://vitejs.dev) | Build tool and dev server |
| [React Router v6](https://reactrouter.com) | Client-side routing |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion) | Animations and scroll effects |
| [Lucide React](https://lucide.dev) | Icon library |
| [Recharts](https://recharts.org) | Financial charts |
| [Axios](https://axios-http.com) | API communication |
| [react-helmet-async](https://github.com/staylor/react-helmet-async) | SEO meta tags |
| [date-fns](https://date-fns.org) | Date formatting |
| [react-easy-crop](https://github.com/ValentinH/react-easy-crop) | Profile photo cropping |

### Backend
| Technology | Purpose |
|---|---|
| [Django 6](https://www.djangoproject.com) | Web framework |
| [Django REST Framework](https://www.django-rest-framework.org) | REST API |
| [SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io) | JWT authentication |
| [pyotp](https://pyauth.github.io/pyotp/) | Two-factor authentication (TOTP) |
| [ReportLab](https://www.reportlab.com) | PDF invoice generation |
| [django-anymail (Brevo)](https://anymail.dev) | Transactional email |
| [Psycopg2](https://pypi.org/project/psycopg2/) | PostgreSQL adapter |
| [WhiteNoise](https://whitenoise.readthedocs.io) | Static file serving |
| [Gunicorn](https://gunicorn.org) | Production WSGI server |
| [Pillow](https://python-pillow.org) | Image handling |

### Infrastructure
| Service | Purpose |
|---|---|
| [Render](https://render.com) | Backend hosting (auto-deploy from GitHub) |
| [Neon](https://neon.tech) | Serverless PostgreSQL database |
| [Cloudinary](https://cloudinary.com) | Image storage and delivery |
| GitHub | Version control and CI/CD trigger |

---

## Project Structure

```
crystal-events/
├── frontend/                  # React (Vite) application
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx    # Home page
│       │   ├── About.jsx
│       │   ├── Services.jsx
│       │   ├── Gallery.jsx
│       │   ├── Contact.jsx
│       │   ├── services/      # Individual service detail pages
│       │   ├── admin/         # Admin panel pages
│       │   └── errors/        # 404 / 403 / 500 error pages
│       ├── components/
│       │   ├── layout/        # Navbar, Layout, CTAFooter, AdminLayout
│       │   └── ErrorBoundary.jsx
│       ├── context/           # Auth and Toast context providers
│       └── utils/             # Axios API instance
│
└── backend/                   # Django REST API
    ├── api/
    │   ├── models.py          # All data models
    │   ├── views.py           # API endpoints
    │   ├── serializers.py
    │   └── urls.py
    ├── crystal_events_backend/ # Django project settings
    ├── requirements.txt
    └── build.sh               # Render deploy script
```

---

## Key Features

- **Sticky scroll-snap layout** — Smooth section-by-section scrolling on the public website (desktop)
- **JWT Authentication** — Secure login with access/refresh token rotation
- **Two-Factor Authentication (2FA)** — TOTP-based 2FA for admin accounts
- **PDF Invoice Generation** — Downloadable PDF quotes/invoices via ReportLab
- **Per-event Financial Tracking** — Income, expenses, profit margin, and payment history per event
- **Audit Log** — Change history tracked on every event record
- **Role-based Access** — Superuser vs. staff permissions across admin pages
- **Email Notifications** — Auto-email on new contact enquiries via Brevo SMTP
- **SEO Optimised** — React Helmet meta tags, canonical URLs, Open Graph tags on every page
- **Responsive Design** — Fully mobile-optimised across all pages
- **Error Pages** — Custom 404, 403, and 500 pages with navigation recovery

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.11+

### 1. Clone the repository

```bash
git clone https://github.com/EbyChacko/crystal_Events.git
cd crystal_Events
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create your local environment file
cp .env.example .env
# Edit .env and fill in your values

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The site will be available at `http://localhost:5173`.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for local development |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) |
| `EMAIL_HOST_USER` | SMTP email address |
| `EMAIL_HOST_PASSWORD` | SMTP password |
| `DATABASE_URL` | PostgreSQL connection string (defaults to Neon in production) |

---

## Deployment

The backend is deployed on **Render** and auto-deploys on every push to `main`. The `build.sh` script runs:

```bash
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
```

The frontend is built with `npm run build` and served as static files.

---

## About Crystal Events

Crystal Events is an Ireland-based event management company founded in 2021. Specialising in Indian and multicultural celebrations, they deliver weddings, corporate events, birthdays, stage decoration, catering, and live music services across all of Ireland, headquartered in Ballinasloe, Galway.

---

## License

This project is proprietary software. All rights reserved by Crystal Events Ireland.
