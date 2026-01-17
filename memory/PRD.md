# Craven Cooling Services Ltd - Field Service Management System

## Original Problem Statement
Build a Field Service Management system for refrigeration/HVAC businesses with two apps:
- Office panel (web): dispatch, schedule, customers, quotes/invoices, reports
- Engineer app (mobile): jobs, checklists, photos, signatures, parts, offline

## User Personas
- **Admin/Owner**: Full system access, manages users, views reports, handles quotes/invoices
- **Dispatcher/Office**: Schedules jobs, manages customers/sites, creates quotes
- **Engineer**: Views assigned jobs, completes job sheets, captures signatures, logs parts

## Core Requirements
- JWT-based authentication with roles
- Customer & Site management with contacts
- Asset management with PM tracking (refrigerant type, charge, intervals)
- Job management with status workflow (pending → travelling → in_progress → completed)
- Scheduling calendar with drag-drop
- Quote & Invoice creation with PDF generation
- Parts catalogue with stock tracking
- Reports dashboard with charts
- Mobile-responsive Engineer app with offline-ready design

## What's Been Implemented (January 2025)
### Backend (FastAPI + MongoDB)
- ✅ Complete auth system with JWT tokens and role-based access
- ✅ Full CRUD for: Customers, Sites, Assets, Jobs, Quotes, Invoices, Parts, Users
- ✅ Dashboard stats API
- ✅ Reports APIs (jobs by status, jobs by engineer, PM due list)
- ✅ PDF generation for Job Reports, Quotes, and Invoices
- ✅ File upload support for photos
- ✅ Job completion workflow with signature, checklist, parts tracking
- ✅ AI summarization endpoint (GPT/Gemini via Emergent LLM key)

### Frontend (React + TailwindCSS + shadcn/ui)
- ✅ Professional login/register with role selection
- ✅ Dashboard with stats cards, pending jobs, PM due alerts
- ✅ Jobs list with filters (status, priority, type)
- ✅ Job detail view with timeline, assets, completion status
- ✅ Scheduler with react-big-calendar
- ✅ Customers, Sites, Assets management pages
- ✅ Quotes & Invoices with line items and PDF download
- ✅ Parts catalogue with stock alerts
- ✅ Users management
- ✅ Reports with recharts visualizations
- ✅ Engineer Mobile View with job sheet, checklist, signature capture

## Tech Stack
- Backend: FastAPI + MongoDB + Motor
- Frontend: React 19 + TailwindCSS + shadcn/ui
- Auth: JWT with bcrypt
- PDF: ReportLab
- Calendar: react-big-calendar
- Charts: recharts
- Signature: react-signature-canvas
- AI: emergentintegrations (GPT-5.2 / Gemini 3 Flash)

## Prioritized Backlog
### P0 (Critical)
- ✅ Core CRUD operations
- ✅ Job workflow
- ✅ Basic reporting

### P1 (Important)
- [ ] Offline mode with service workers
- [ ] Photo upload to jobs
- [ ] Email notifications for job assignments
- [ ] PM auto-generation (create PM jobs automatically)

### P2 (Nice to have)
- [ ] Map view for engineer locations
- [ ] Xero/QuickBooks integration
- [ ] Customer portal
- [ ] Mobile push notifications

## Next Tasks
1. Add offline support with service worker and IndexedDB caching
2. Implement photo upload and display in job completion
3. Add email notifications using SendGrid/Resend
4. Create PM automation to auto-generate service jobs when due
5. Add map view showing engineer locations
