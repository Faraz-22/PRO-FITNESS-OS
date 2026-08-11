# PRO FITNESS OS — Database & Domain Architecture

> **Version**: 0.1.0
> **Last Updated**: 2026-08-11
> **Status**: Planning — schema will be built incrementally per roadmap phase

---

## Design Principles

1. **Incremental schema building**: Models are added phase by phase. Do not create all tables upfront.
2. **Single User table for authentication**: All roles (admin, trainer, member) authenticate as a `User`. Role determines access.
3. **Soft deletes for domain entities**: Members and important records use `deletedAt` instead of hard deletes.
4. **Audit fields on all domain tables**: `createdAt`, `updatedAt`, `createdById`, `updatedById`.
5. **Enum types for status fields**: Use Prisma enums, not magic strings.
6. **Event sourcing for scoring**: ProScore uses a ledger of `ScoreEvent` records aggregated into `WeeklyScore`.
7. **Denormalized counters where performance matters**: Post like counts, comment counts, leaderboard totals.
8. **Financial precision**: All monetary amounts stored as `Decimal` (Prisma) / `DECIMAL(10,2)` (PostgreSQL). Never use `Float` for money.

---

## Entity Relationship Overview

```
User (authentication)
  ├── has one MemberProfile
  ├── has one StaffProfile
  ├── has many UserRole → Role
  └── has many Session

MemberProfile
  ├── has many Membership → MembershipPlan
  ├── has many Payment → Invoice → InvoiceItem
  ├── has many Attendance
  ├── has many Measurement
  ├── has many ProgressPhoto
  ├── has many Goal
  ├── has many WorkoutLog
  ├── has many ScoreEvent → WeeklyScore
  ├── has many Notification
  ├── has many CommunityPost
  └── assigned to TrainerAssignment → StaffProfile (trainer)

StaffProfile
  ├── has role via UserRole
  ├── has many TrainerAssignment (if trainer)
  ├── has many WorkoutPlan (created by)
  └── recorded many Payment (received by)

Lead
  ├── has many FollowUp
  └── converts to User + MemberProfile

Website (singleton)
  ├── has many Page → Section
  ├── has many Media
  ├── has many Testimonial
  └── has many FAQ
```

---

## Complete Entity Catalog

Entities are grouped by domain and listed in the order they will be implemented.

### Phase 0–1: Identity & Access

#### User
The central authentication entity. Every person in the system is a User.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| email | String | Unique, lowercase, required |
| emailVerified | DateTime? | Null until verified |
| passwordHash | String | bcrypt hash |
| name | String | Display name |
| phone | String? | Indian mobile number |
| avatar | String? | URL to profile photo |
| isActive | Boolean | Default true. False = suspended. |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### Role
Static roles in the system.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| name | Enum (RoleName) | SUPER_ADMIN, ADMIN, MANAGER, TRAINER, RECEPTIONIST, MEMBER |
| description | String? | Human-readable description |
| level | Int | Hierarchy level (100, 80, 60, 40, 20, 10) |

#### UserRole
Many-to-many: User ↔ Role. A user can have multiple roles (e.g., a trainer who is also a member).

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → User |
| roleId | String | FK → Role |
| assignedAt | DateTime | When the role was assigned |
| assignedById | String? | FK → User (who assigned it) |

#### Session (Auth.js managed)
| Field | Type | Notes |
|-------|------|-------|
| id | String | Primary key |
| sessionToken | String | Unique token |
| userId | String | FK → User |
| expires | DateTime | Session expiry |

#### VerificationToken (Auth.js managed)
| Field | Type | Notes |
|-------|------|-------|
| identifier | String | Email address |
| token | String | Unique token |
| expires | DateTime | Token expiry |

#### PasswordResetToken
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → User |
| token | String | Unique, hashed |
| expires | DateTime | 1 hour from creation |
| used | Boolean | Default false |

---

### Phase 1–2: Member & Membership

#### MemberProfile
Extended profile for gym members.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → User (unique, 1:1) |
| dateOfBirth | DateTime? | |
| gender | Enum (Gender) | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY |
| address | String? | |
| emergencyContact | String? | Phone number |
| emergencyContactName | String? | |
| bloodGroup | String? | |
| medicalConditions | String? | Text field for known conditions |
| fitnessGoal | Enum (FitnessGoal)? | WEIGHT_LOSS, MUSCLE_GAIN, GENERAL_FITNESS, STRENGTH, ENDURANCE, FLEXIBILITY |
| experienceLevel | Enum (ExperienceLevel)? | BEGINNER, INTERMEDIATE, ADVANCED |
| dietPreference | Enum (DietPreference)? | VEGETARIAN, NON_VEGETARIAN, VEGAN, EGGETARIAN |
| comfortLevel | Enum (ComfortLevel)? | For Confidence Mode: COMFORTABLE, SOMEWHAT_COMFORTABLE, HESITANT, VERY_HESITANT |
| isConfidenceMode | Boolean | Default false. Private profile for hesitant members. |
| joinedAt | DateTime | When they officially joined the gym |
| notes | String? | Admin notes |
| deletedAt | DateTime? | Soft delete |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### MembershipPlan
Available membership plans.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| name | String | e.g., "Gold Membership" |
| description | String? | |
| durationDays | Int | Duration in days (30, 90, 180, 365) |
| price | Decimal | In INR |
| features | String[] | List of features |
| isActive | Boolean | Can be sold to new members |
| sortOrder | Int | Display order |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### Membership
A member's subscription to a plan.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| membershipPlanId | String | FK → MembershipPlan |
| startDate | DateTime | When it starts |
| endDate | DateTime | When it expires |
| status | Enum (MembershipStatus) | ACTIVE, EXPIRED, CANCELLED, FROZEN |
| cancelledAt | DateTime? | |
| cancelReason | String? | |
| createdById | String | FK → User (staff who created it) |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### Phase 2–3: Staff & Leads

#### StaffProfile
Extended profile for gym staff (admins, managers, trainers, receptionists).

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → User (unique, 1:1) |
| employeeId | String? | Internal employee ID |
| specialization | String? | For trainers: "Strength", "Yoga", etc. |
| bio | String? | Public bio for trainers |
| certifications | String[] | List of certifications |
| joinedAt | DateTime | Employment start date |
| isActive | Boolean | Default true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### TrainerAssignment
Links a trainer to a member.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| trainerProfileId | String | FK → StaffProfile |
| memberProfileId | String | FK → MemberProfile |
| assignedAt | DateTime | |
| assignedById | String | FK → User |
| unassignedAt | DateTime? | Null if currently assigned |
| notes | String? | |

#### Lead
A potential member who has shown interest.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| name | String | |
| phone | String? | |
| email | String? | |
| source | Enum (LeadSource) | WEBSITE, WALK_IN, REFERRAL, SOCIAL_MEDIA, PHONE, OTHER |
| status | Enum (LeadStatus) | NEW, CONTACTED, INTERESTED, TRIAL, CONVERTED, LOST |
| notes | String? | |
| assignedToId | String? | FK → User (staff handling this lead) |
| convertedToUserId | String? | FK → User (if converted) |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### FollowUp
Scheduled follow-up actions for leads.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| leadId | String | FK → Lead |
| scheduledAt | DateTime | When to follow up |
| completedAt | DateTime? | When it was done |
| method | Enum (FollowUpMethod) | PHONE, WHATSAPP, EMAIL, IN_PERSON |
| notes | String? | Result of the follow-up |
| createdById | String | FK → User |

---

### Phase 3: Attendance

#### Attendance
Gym check-in/check-out records.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| checkInAt | DateTime | Required |
| checkOutAt | DateTime? | Optional |
| method | Enum (CheckInMethod) | MANUAL, QR_CODE, BIOMETRIC |
| checkedInById | String? | FK → User (receptionist, if manual) |
| notes | String? | |

---

### Phase 4: Payments & Invoicing

#### Payment
Financial transaction record.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| amount | Decimal | In INR |
| currency | String | Default "INR" |
| method | Enum (PaymentMethod) | CASH, UPI, CARD, NET_BANKING, RAZORPAY |
| status | Enum (PaymentStatus) | PENDING, COMPLETED, FAILED, REFUNDED |
| razorpayOrderId | String? | Razorpay order ID |
| razorpayPaymentId | String? | Razorpay payment ID |
| razorpaySignature | String? | For verification |
| description | String? | e.g., "Gold Membership — 3 months" |
| receivedById | String? | FK → User (staff who received cash) |
| receivedAt | DateTime? | When cash was received |
| refundedAt | DateTime? | |
| refundReason | String? | |
| membershipId | String? | FK → Membership (what was paid for) |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### Invoice

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| invoiceNumber | String | Unique, auto-generated: PF-2026-0001 |
| memberProfileId | String | FK → MemberProfile |
| paymentId | String? | FK → Payment |
| subtotal | Decimal | Before tax/discount |
| taxRate | Decimal | GST percentage (e.g., 18.00) |
| taxAmount | Decimal | Calculated tax |
| discountAmount | Decimal | Discount applied |
| totalAmount | Decimal | Final amount |
| status | Enum (InvoiceStatus) | DRAFT, ISSUED, PAID, CANCELLED |
| issuedAt | DateTime? | |
| notes | String? | |
| createdById | String | FK → User |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### InvoiceItem

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| invoiceId | String | FK → Invoice |
| description | String | Line item description |
| quantity | Int | Default 1 |
| unitPrice | Decimal | Price per unit |
| amount | Decimal | quantity * unitPrice |
| sortOrder | Int | Display order |

---

### Phase 5: Workouts

#### Exercise
Library of exercises.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| name | String | |
| category | Enum (ExerciseCategory) | STRENGTH, CARDIO, FLEXIBILITY, BALANCE, HIIT |
| muscleGroup | String? | Primary muscle group |
| description | String? | |
| instructions | String? | How to perform |
| mediaUrl | String? | Demo image/video URL |
| isActive | Boolean | Default true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### WorkoutPlan

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| name | String | |
| description | String? | |
| targetGoal | Enum (FitnessGoal)? | What this plan is for |
| durationWeeks | Int? | Planned duration |
| createdById | String | FK → User (trainer) |
| isTemplate | Boolean | Can be reused as template |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### Workout

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| workoutPlanId | String | FK → WorkoutPlan |
| dayNumber | Int | Day 1, Day 2, etc. |
| name | String | e.g., "Push Day", "Leg Day" |
| notes | String? | |
| sortOrder | Int | |

#### WorkoutExercise

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| workoutId | String | FK → Workout |
| exerciseId | String | FK → Exercise |
| sets | Int | |
| reps | String | "12" or "8-12" or "AMRAP" |
| restSeconds | Int? | Rest between sets |
| notes | String? | |
| sortOrder | Int | |

#### WorkoutLog

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| workoutId | String? | FK → Workout (null for custom/freestyle) |
| date | DateTime | When the workout was done |
| duration | Int? | Minutes |
| notes | String? | |
| mood | Enum (MoodRating)? | GREAT, GOOD, OKAY, LOW, TERRIBLE |
| createdAt | DateTime | Auto |

#### WorkoutLogExercise

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| workoutLogId | String | FK → WorkoutLog |
| exerciseId | String | FK → Exercise |
| sets | Json | Array of { reps, weight, unit } |
| notes | String? | |

---

### Phase 6: Progress & Measurements

#### Measurement

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| date | DateTime | Measurement date |
| weight | Decimal? | kg |
| height | Decimal? | cm |
| bodyFatPercentage | Decimal? | |
| chest | Decimal? | cm |
| waist | Decimal? | cm |
| hips | Decimal? | cm |
| bicepLeft | Decimal? | cm |
| bicepRight | Decimal? | cm |
| thighLeft | Decimal? | cm |
| thighRight | Decimal? | cm |
| notes | String? | |
| measuredById | String? | FK → User (trainer who measured) |
| createdAt | DateTime | Auto |

#### ProgressPhoto

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| imageUrl | String | Object storage URL (private bucket) |
| thumbnailUrl | String? | |
| type | Enum (PhotoType) | FRONT, SIDE, BACK, CUSTOM |
| date | DateTime | When the photo was taken |
| notes | String? | |
| isPublic | Boolean | Default false |
| createdAt | DateTime | Auto |

#### Goal

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| type | Enum (GoalType) | WEIGHT, BODY_FAT, STRENGTH, ATTENDANCE, CUSTOM |
| title | String | e.g., "Reach 75 kg" |
| targetValue | Decimal? | |
| currentValue | Decimal? | |
| unit | String? | "kg", "%", "days", etc. |
| deadline | DateTime? | |
| status | Enum (GoalStatus) | ACTIVE, ACHIEVED, ABANDONED |
| achievedAt | DateTime? | |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### Phase 7: CMS

#### Website

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key (singleton) |
| name | String | Gym name |
| tagline | String? | |
| logoUrl | String? | |
| faviconUrl | String? | |
| primaryColor | String? | Hex color |
| secondaryColor | String? | Hex color |
| socialLinks | Json | { facebook, instagram, youtube, whatsapp } |
| contactEmail | String? | |
| contactPhone | String? | |
| address | String? | |
| googleMapsUrl | String? | |
| metaTitle | String? | SEO title |
| metaDescription | String? | SEO description |
| updatedAt | DateTime | Auto |

#### Page

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| slug | String | URL slug, unique |
| title | String | |
| metaTitle | String? | |
| metaDescription | String? | |
| isPublished | Boolean | Default false |
| sortOrder | Int | Navigation order |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### Section

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| pageId | String | FK → Page |
| type | Enum (SectionType) | HERO, FEATURES, PRICING, TESTIMONIALS, TRAINERS, etc. |
| title | String? | |
| subtitle | String? | |
| content | Json | Structured content specific to section type |
| settings | Json? | Visual settings |
| isVisible | Boolean | Default true |
| sortOrder | Int | Display order |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### Media

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| filename | String | |
| url | String | |
| thumbnailUrl | String? | |
| mimeType | String | |
| sizeBytes | Int | |
| altText | String? | |
| folder | String? | |
| uploadedById | String | FK → User |
| createdAt | DateTime | Auto |

#### Testimonial

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberName | String | |
| content | String | |
| rating | Int? | 1-5 |
| photoUrl | String? | |
| isApproved | Boolean | Default false |
| isPublished | Boolean | Default false |
| sortOrder | Int | |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### FAQ

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| question | String | |
| answer | String | |
| category | String? | |
| isPublished | Boolean | Default true |
| sortOrder | Int | |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### Phase 8: Notifications & Audit

#### Notification

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → User |
| type | Enum (NotificationType) | MEMBERSHIP_EXPIRY, PAYMENT_RECEIVED, etc. |
| title | String | |
| message | String | |
| link | String? | |
| isRead | Boolean | Default false |
| readAt | DateTime? | |
| createdAt | DateTime | Auto |

#### Announcement

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| title | String | |
| content | String | |
| targetAudience | Enum (Audience) | ALL, MEMBERS, TRAINERS, STAFF |
| isActive | Boolean | |
| startsAt | DateTime | |
| endsAt | DateTime? | |
| createdById | String | FK → User |
| createdAt | DateTime | Auto |

#### AuditLog

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → User |
| action | String | e.g., "member.create" |
| entityType | String | e.g., "MemberProfile" |
| entityId | String | |
| changes | Json? | Before/after snapshot |
| ipAddress | String? | |
| userAgent | String? | |
| createdAt | DateTime | Auto (immutable) |

#### Settings

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| key | String | Unique (e.g., "invoice.nextSequence") |
| value | String | |
| updatedAt | DateTime | Auto |
| updatedById | String? | FK → User |

---

### Phase 9: ProScore & Community

#### ScoreEvent

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| eventType | Enum (ScoreEventType) | ATTENDANCE_CHECK_IN, WORKOUT_LOGGED, etc. |
| points | Int | |
| metadata | Json? | |
| occurredAt | DateTime | |
| createdAt | DateTime | Auto |

#### WeeklyScore

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| weekStart | DateTime | Monday |
| attendanceScore | Decimal | |
| workoutScore | Decimal | |
| challengeScore | Decimal | |
| nutritionScore | Decimal | |
| progressScore | Decimal | |
| tribeScore | Decimal | |
| coachScore | Decimal | |
| totalScore | Decimal | 0-100 |
| level | Enum (ScoreLevel) | |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### Streak

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| memberProfileId | String | FK → MemberProfile |
| type | Enum (StreakType) | TRAINING, NUTRITION, MIND, TRIBE |
| currentCount | Int | |
| longestCount | Int | |
| lastActivityAt | DateTime | |
| brokenAt | DateTime? | |
| updatedAt | DateTime | Auto |

#### CommunityPost

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| authorId | String | FK → User |
| type | Enum (PostType) | |
| content | String | |
| mediaUrls | String[] | |
| isApproved | Boolean | Default true |
| isPinned | Boolean | Default false |
| likeCount | Int | Denormalized |
| commentCount | Int | Denormalized |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### PostReaction

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| postId | String | FK → CommunityPost |
| userId | String | FK → User |
| type | Enum (ReactionType) | LIKE, FIRE, STRONG, CLAP |
| createdAt | DateTime | Auto |

#### PostComment

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| postId | String | FK → CommunityPost |
| authorId | String | FK → User |
| content | String | |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

## Key Indexes

```
User(email)                              -- Unique
UserRole(userId, roleId)                 -- Unique composite
MemberProfile(userId)                    -- Unique
StaffProfile(userId)                     -- Unique
Membership(memberProfileId, status)      -- Active lookup
Membership(endDate)                      -- Expiry queries
Attendance(memberProfileId, checkInAt)   -- History
Payment(memberProfileId, status)         -- Payment history
Invoice(invoiceNumber)                   -- Unique
Lead(status)                             -- Pipeline
Lead(email)                              -- Duplicate detection
ScoreEvent(memberProfileId, occurredAt)  -- Score calc
WeeklyScore(memberProfileId, weekStart)  -- Score history
CommunityPost(createdAt)                 -- Feed ordering
Notification(userId, isRead, createdAt)  -- Notification feed
AuditLog(userId, createdAt)              -- Audit queries
AuditLog(entityType, entityId)           -- Entity history
Page(slug)                               -- Unique, URL routing
Section(pageId, sortOrder)               -- Page rendering
```

---

## Migration Strategy

1. **Phase 0**: Create initial schema with `User`, `Session`, `VerificationToken` only.
2. **Each subsequent phase**: Add new models via `npx prisma migrate dev --name phase_N_description`.
3. **Never** run `prisma migrate reset` in production.
4. **Destructive changes** (dropping columns/tables) require explicit approval and a data migration plan.
5. **Seed data** is maintained in `prisma/seed.ts` and should be idempotent.
