Product Requirements Document (PRD): Crystal Events

Version: 1.0 Date: February 17, 2026 Project Name: Crystal Events Management Platform (Ireland & UK) Document Status: Approved

1. Executive Summary

Crystal Events is an event management company based in Ireland with a branch in the UK. The goal is to build a high-performance, responsive, and SEO-optimized web platform that serves two primary functions:

Public-Facing Website: A modern, visually stunning portfolio and lead generation tool for potential clients.

Internal Admin Portal: A comprehensive backend system for managing events, generating financial reports (Income/Expense/Profit), managing quotes, and tracking business logistics.

2. Target Audience

Primary: Individuals and Corporations in Ireland and the UK seeking event management services.

Secondary: Internal staff and Super Admins managing the business operations.

3. Technology Stack

Frontend: React.js (Vite)

Styling: Bootstrap 5 (Customized) or Tailwind CSS, Framer Motion (for Parallax effects).

Backend: Django (Python) with Django REST Framework (DRF).

Database: PostgreSQL.

Notifications: Twilio API / Meta WhatsApp API.

Deployment: Docker, Nginx, Gunicorn.

4. Design & UI/UX Specifications

4.1 Color Palette

Primary Brand Color: Deep Teal #012F2F (Headers, Primary Buttons, Footer).

Accent Color: Mustard Gold #EEBF59 (Call to Actions, Highlights, Icons).

Neutral/Text: Dark Gray #333333 (Body Text), Off-White #F9F9F9 (Backgrounds).

Success/Error: Emerald Green (Profit/Success), Burnt Orange (Expense/Alerts).

4.2 UI Behaviors

Parallax Effect: Smooth scrolling parallax on the Landing Page Hero section and between content blocks (e.g., specific event showcases).

Responsiveness: Mobile-first design. Burger menu for mobile navigation.

Accessibility: WCAG 2.1 AA Compliant (Alt text, contrast ratios, keyboard navigation).

5. Functional Requirements (Public Website)

5.1 Landing Page

Hero Section: High-quality background image/video, Parallax effect, H1 "Making Your Events Crystal Clear", CTA Button "Get a Quote".

Services Preview: Grid layout of top services (Weddings, Corporate, Parties) with hover effects.

Why Choose Us: 3-column layout (Experienced, Creative, Budget-Friendly).

5.2 About Us & Gallery

About: Company history (Ireland/UK roots), Team section.

Gallery: Masonry grid layout with lightbox viewer for high-res event images.

5.3 Services (Dynamic)

Fetched from the backend.

Displays Service Name, Description, Starting Price, and "Book Now" button.

5.4 Contact Us

Form Fields: Name, Phone, Email, Event Type, Date, Message.

WhatsApp Integration:

Logic: On form submit, backend triggers a WhatsApp message to the Admin's registered number: "New Inquiry: [Name] for [Event] on [Date]".

User Feedback: "Thank you! We have received your query."

Fallback: Email notification to info@crystaleventsie.com and confirmation email to the customer.

6. Functional Requirements (Admin/Backend)

6.1 Authentication & User Roles

Superuser: Full access to all data, create/delete other admins.

Admin/Staff: Can manage events, add expenses, view calendar (Permissions managed via Django Groups).

6.2 Event Management Module

Create Event: Client Name, Contact Info, Event Date, Booking Date, Venue, Status (Upcoming, Finished, Canceled).

Event History: Log changes without erasing old data (Audit Trail).

Calendar View: Visual calendar showing events color-coded by status.

6.3 Financial Module

Quote Engine:

Dropdown to select "Service" (e.g., Wedding Decor).

Auto-fill "Minimum Amount".

Editable field for "Final Quote Amount".

Generate PDF Quote.

Income & Expense Tracking:

Expense Entry: Date, Amount, Reason, Category, Approved By (Dropdown of Admins).

Bill Upload: Ability to upload multiple images/PDFs for a single expense entry.

6.4 Reporting & Analytics

Dashboard:

Total Income vs. Total Expense (Monthly/Yearly).

Profit Margin Calculation.

Number of Events (Completed vs. Canceled).

Export: Download reports as CSV/PDF.

7. SEO Strategy (Ireland & UK Focus)

Keywords: "Event Management Ireland", "Wedding Planner UK", "Corporate Events Dublin", "Party Planners London".

Technical SEO:

Server-Side Rendering (SSR) or Prerendering for React.

sitemap.xml and robots.txt configuration.

Schema Markup (LocalBusiness, EventPlanner).

Meta Tags dynamically generated for Service pages.

8. The Master Prompt (Rewritten)

Use the following prompt to generate the code structure with an LLM or Developer:

Act as a Senior Full-Stack Developer and UI/UX Designer.

Project: Create a comprehensive Event Management Web Application named "Crystal Events". Context: The business operates in Ireland and the UK. Tech Stack: Backend: Django (Django REST Framework). Frontend: React (Vite). Styling: Tailwind CSS or Bootstrap 5. Database: PostgreSQL.

Design Requirements:

Theme: Use a color palette of Deep Teal (#012F2F), Mustard Gold (#EEBF59), Dark Gray, and White.

UI: Implement smooth Parallax scrolling effects on the Landing Page. Ensure the site is fully responsive and meets WCAG accessibility standards.

Layout: Create specific pages: Hero (Landing), About Us, Gallery (Masonry), Services, and Contact Us.

Footer: Include social icons for YouTube, Facebook, and Instagram (@irl_crystalevents).

Backend Features (Django):

Models:

Service: Name, Description, Base Price.

Event: Customer Info, Date, Status (Upcoming, Finished, Canceled), Audit Log.

Expense: Date, Amount, Reason, ApprovedBy, ReceiptImage (support multiple uploads).

Quote: Linked to Service, Editable Amount, Generated Status.

API: REST endpoints for all models.

Authentication: JWT Auth. Role-based access (Superuser vs Staff).

Logic: Calculate Monthly Income, Expense, and Profit.

Frontend Features (React):

Public Site: Fetch Services from API. Contact form that triggers a backend function to send WhatsApp notifications (mock this integration function if API keys are missing).

Admin Dashboard:

Calendar: Visual display of upcoming events.

Financials: Forms to add Expenses (with file upload preview) and Generate Quotes.

Charts: Display Monthly Income vs Expense using Chart.js.

SEO & Performance:

Include Meta tags for "Event Management Ireland/UK".

Ensure fast load times and secure headers.

Output: Provide the folder structure, models.py, serializers.py, views.py for the backend, and key React components (App.jsx, Home.jsx, Dashboard.jsx, ExpenseForm.jsx) with the specified UI styling.