# PRO FITNESS OS — Development Roadmap

> **Version**: 0.2.0
> **Last Updated**: 2026-08-20
> **Status**: Development

---

## Phase 0: Architecture & Project Initialization

**Duration**: 1 sprint (1 week)
**Goal**: Establish the project foundation, tooling, and development environment.

### Deliverables

- [x] Repository audit
- [x] Architecture documents (ARCHITECTURE.md, DATABASE.md, ROADMAP.md, SECURITY.md, INTEGRATIONS.md)
- [x] AGENTS.md for AI coding agents
- [x] Next.js project initialization with TypeScript
- [x] Tailwind CSS 4 + design system tokens (black-gold theme)
- [x] shadcn/ui initialization
- [x] Prisma setup with PostgreSQL connection
- [ ] Docker Compose for local PostgreSQL + Redis
- [x] ESLint + Prettier configuration
- [x] Auth.js v5 installation and skeleton config
- [x] Basic folder structure creation
- [x] `.env.example` with all required variables
- [x] `.gitignore`
- [x] `README.md`
- [x] Initial `prisma/schema.prisma`
- [x] First migration
- [ ] CI pipeline (GitHub Actions: lint + typecheck + build)
- [ ] Vercel project connection (manual step)

### Exit Criteria

- `npm run dev` starts without errors
- `npm run build` succeeds
- `npm run lint` passes
- `npm run typecheck` passes
- Database connection works
- Project deploys to Vercel preview

---

## Phase 1: Authentication & Core Models

**Duration**: 2 sprints (2 weeks)
**Goal**: Working authentication system and core database schema.

### Sprint 1.1: Authentication

- [x] Database schema: User, Account, Session, VerificationToken
- [x] Auth.js configuration with Credentials provider
- [ ] Registration flow (email + password)
- [x] Login flow
- [ ] Email verification flow
- [ ] Password reset flow
- [x] Auth middleware for protected routes
- [x] Login and register pages (styled)
- [x] Session management

### Sprint 1.2: Core Models & RBAC

- [x] Database schema: Role, Permission, UserRole
- [x] RBAC service with permission checks
- [x] Member, Staff, Trainer profile models
- [x] MembershipPlan, Membership models
- [x] Server-side authorization helpers
- [x] Middleware route protection by role
- [ ] Super Admin seed script
- [x] Basic dashboard layout (sidebar, topbar, mobile nav)

### Exit Criteria

- Users can register, verify email, login, reset password
- RBAC prevents unauthorized access
- Dashboard shell renders for authenticated users
- All auth flows have unit tests

---

## Phase 2: Admin Dashboard — Member & Membership Management

**Duration**: 2 sprints (2 weeks)
**Goal**: Admin can manage members, plans, and memberships.

### Sprint 2.1: Member Management

- [ ] Admin member list with search, filter, pagination
- [ ] Add new member form
- [ ] Edit member profile
- [ ] View member details
- [x] Member status (Active, Inactive, Suspended)
- [ ] Soft delete member
- [x] Audit logging for member operations

### Sprint 2.2: Membership Management

- [x] MembershipPlan CRUD (name, duration, price, features) (Schema & Actions)
- [ ] Assign membership to member
- [x] Membership status tracking (Active, Expired, Cancelled)
- [ ] Expiry alerts and dashboards
- [ ] Membership renewal flow
- [ ] Membership history

### Exit Criteria

- Admin can create/read/update members
- Admin can create membership plans
- Admin can assign memberships to members
- Expiring memberships are visible
- All operations are audit-logged

---

## Phase 3: Lead Management & Attendance

**Duration**: 2 sprints (2 weeks)
**Goal**: CRM lead tracking and attendance system.

### Sprint 3.1: Lead Management

- [x] Lead model (name, phone, email, source, status, notes)
- [x] Lead pipeline view (New → Contacted → Interested → Converted → Lost) (Schema & Actions)
- [ ] Add lead from admin
- [ ] Public website contact form → creates lead
- [x] Follow-up scheduling and tracking (Schema)
- [x] Lead → Member conversion flow (Schema)
- [ ] Lead analytics (source breakdown, conversion rate)

### Sprint 3.2: Attendance Management

- [x] Attendance model (memberId, checkInAt, checkOutAt, method)
- [ ] Admin attendance view (daily, weekly, monthly)
- [ ] Manual check-in by receptionist
- [ ] QR code check-in flow
- [ ] Attendance streaks calculation
- [ ] Attendance reports
- [ ] Inactive member alerts

### Exit Criteria

- Leads flow from website to admin pipeline
- Follow-ups are trackable
- Attendance is recordable and viewable
- Streak logic has unit tests

---

## Phase 4: Payment & Invoicing

**Duration**: 2 sprints (2 weeks)
**Goal**: Complete payment recording, invoicing, and receipt generation.

### Sprint 4.1: Payment Management

- [x] Payment model and service
- [x] Record cash/offline payment (Schema & Actions)
- [ ] Razorpay integration for online payments
- [ ] Payment webhook handler
- [x] Payment history per member (Schema)
- [ ] Payment reports (daily, monthly revenue)
- [ ] Refund flow

### Sprint 4.2: Invoicing & Receipts

- [x] Invoice model with auto-generated invoice numbers
- [ ] Invoice generation on payment completion
- [ ] Invoice PDF generation
- [ ] Digital receipt view in member portal
- [ ] Thermal receipt printing (browser print CSS)
- [ ] Invoice list and search in admin
- [ ] GST/tax calculation

### Exit Criteria

- Payments can be recorded (cash and online)
- Razorpay webhook works correctly
- Invoices are auto-generated
- Receipts are printable
- Payment calculations have unit tests

---

## Phase 5: Staff, Trainer & Workout Management

**Duration**: 2 sprints (2 weeks)
**Goal**: Staff roles, trainer assignment, and workout plan system.

### Sprint 5.1: Staff & Trainer Management

- [ ] Staff directory in admin
- [ ] Invite staff member (email invite → registration)
- [ ] Assign role to staff
- [x] Trainer profile management (Schema)
- [x] Trainer-member assignment (Schema)
- [ ] Trainer dashboard (assigned members, schedules)
- [ ] Staff schedule management

### Sprint 5.2: Workout Management

- [x] Exercise library (name, category, muscle group, description, media) (Schema & Actions)
- [x] WorkoutPlan model (name, trainer, targetGoal)
- [x] Workout model (day, exercises, sets, reps, rest)
- [x] Assign workout plan to member
- [ ] Member views assigned plan
- [x] Workout logging by member (Schema & Actions)
- [ ] Trainer reviews workout logs

### Exit Criteria

- Staff and trainers are manageable
- Workout plans can be created and assigned
- Members can view and log workouts

---

## Phase 6: Member Portal & Progress Tracking ← CURRENT

**Duration**: 2 sprints (2 weeks)
**Goal**: Member-facing dashboard with progress tracking.

### Sprint 6.1: Member Dashboard

- [x] Member Arena (daily hub)
- [x] Club Pass (membership info, attendance)
- [ ] Profile page
- [ ] Account settings
- [ ] Notification center
- [x] Mobile-responsive dashboard

### Sprint 6.2: Progress & Measurements

- [x] Measurement model (weight, height, bodyFat, chest, waist, etc.)
- [x] Measurement logging (Schema & Actions)
- [x] Progress photo upload (private) (Schema)
- [x] Goal setting and tracking (Schema & Actions)
- [x] Progress charts and timeline (Dashboard Scaffold)
- [ ] Transformation milestones

### Exit Criteria

- Members have a functional personal portal
- Progress tracking is working
- Progress photos are private
- Mobile experience is polished

---

## Phase 7: Public Website & CMS

**Duration**: 2 sprints (2 weeks)
**Goal**: Stunning public website with admin-editable content.

### Sprint 7.1: Public Website

- [ ] Homepage (hero, features, testimonials, CTA)
- [ ] Memberships page
- [ ] Trainers page
- [ ] Transformations page
- [ ] About page
- [ ] Contact page with lead capture form
- [ ] SEO optimization
- [ ] Responsive design
- [ ] Black-gold premium aesthetic

### Sprint 7.2: CMS

- [ ] Website settings editor (name, logo, social links)
- [ ] Page manager (list, create, edit, reorder)
- [ ] Section editor (add, edit, reorder, remove sections)
- [ ] Section type components (Hero, Pricing, Testimonials, etc.)
- [ ] Media library (upload, organize, delete)
- [ ] Testimonial management
- [ ] FAQ management
- [ ] Live preview

### Exit Criteria

- Public website is beautiful and fast
- Admin can edit all content without a developer
- SEO basics are in place
- Lead capture works

---

## Phase 8: Notifications, Audit & Analytics

**Duration**: 2 sprints (2 weeks)
**Goal**: Notification system, audit trail, and business analytics.

### Sprint 8.1: Notifications & Audit

- [ ] In-app notification system
- [ ] Email notifications (via BullMQ queue)
- [ ] Notification preferences
- [ ] Announcement system (admin → all members)
- [x] Audit log model and service
- [ ] Audit log viewer in admin
- [ ] Filter/search audit logs

### Sprint 8.2: Analytics & Reporting

- [ ] Admin overview dashboard (KPIs)
- [ ] Revenue analytics
- [ ] Member growth analytics
- [ ] Attendance analytics
- [ ] Membership renewal rate
- [ ] Lead conversion funnel
- [ ] Trainer performance metrics
- [ ] Export reports (CSV)

### Exit Criteria

- Notifications are delivered reliably
- All sensitive operations are audit-logged
- Admin has actionable analytics

---

## Phase 9: ProScore, Challenges & Community (Product Vision Features)

**Duration**: 3 sprints (3 weeks)
**Goal**: Gamification and community features from the product vision.

### Sprint 9.1: ProScore & Streaks

- [ ] ScoreEvent model (event ledger)
- [ ] WeeklyScore aggregation
- [ ] ProScore calculation service
- [ ] Streak tracking (training, nutrition, mind, tribe)
- [ ] Streak Rings UI component
- [ ] ProScore display on Arena
- [ ] Score level badges

### Sprint 9.2: Challenges

- [ ] Challenge model (type, dates, tasks, rewards)
- [ ] Challenge creation (admin)
- [ ] Challenge participation (member)
- [ ] Daily task completion
- [ ] Challenge leaderboard
- [ ] Challenge completion badges
- [ ] Gold Drop weekly recognition

### Sprint 9.3: Community (Tribe)

- [ ] Community post model
- [ ] Structured feed (wins, progress, challenges, questions)
- [ ] Post creation with media
- [ ] Reactions and comments
- [ ] Circles (women, beginners, batches)
- [ ] Content moderation (admin)
- [ ] Confidence Mode (private profile, anonymous questions)

### Exit Criteria

- ProScore calculates correctly
- Challenges drive participation
- Community feed is functional
- Confidence Mode works

---

## Phase 10: Advanced Features & Polish

**Duration**: Ongoing
**Goal**: AI integration, advanced printer support, WhatsApp, and polish.

### Planned Features

- [ ] AI meal suggestions (OpenAI integration)
- [ ] AI trainer chat
- [ ] AI habit coaching
- [ ] WhatsApp notifications (Business API)
- [ ] SMS notifications
- [ ] Advanced thermal printer support (ESC/POS)
- [ ] QR code attendance with hardware scanner
- [ ] Mobile app (React Native or PWA)
- [ ] Multi-gym support
- [ ] Franchise management
- [ ] Advanced retention analytics
- [ ] Referral program
- [ ] Transformation program sales

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Stick to phase deliverables. No phase jumping. |
| Performance with complex queries | Medium | Add database indexes early. Use Prisma query optimization. |
| Razorpay webhook reliability | Medium | Implement idempotent webhook handlers with retry logic. |
| Image storage costs | Low | Compress before upload. Use R2 (free egress). |
| AI API costs | Medium | Rate limit AI usage. Cache common responses. |
| Single-developer bottleneck | High | Keep architecture simple. Document everything. |
