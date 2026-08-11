# PRO FITNESS OS — Integration Plan

> **Version**: 0.1.0
> **Last Updated**: 2026-08-11
> **Status**: Planning

---

## Overview

This document describes all third-party integrations, their purpose, implementation timeline, and security considerations. No integration should be fabricated — only services with real APIs and clear use cases are listed.

---

## Active Integrations (Planned for Phase 1–4)

### 1. Resend — Transactional Email

**Purpose**: Send verification emails, password resets, membership reminders, payment receipts.

**Phase**: 1 (Authentication)

**Integration Type**: Server-side API calls via BullMQ email worker.

**API**: REST API — `POST https://api.resend.com/emails`

**Required Credentials**:
| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key from Resend dashboard |
| `EMAIL_FROM` | Verified sender address (e.g., `noreply@profitness.in`) |

**Implementation**:
```
src/lib/email/
  send.ts              # Resend client wrapper
  templates/           # React Email templates
    verify-email.tsx
    welcome.tsx
    password-reset.tsx
    membership-expiry.tsx
    payment-receipt.tsx
```

**Security**:
- API key stored in environment variables only (server-side)
- Rate limit: Resend handles delivery rate limiting
- Templates are server-rendered, no user-controlled HTML injection

**Verification Required**:
- Domain verification via DNS (SPF, DKIM, DMARC records)
- Must be completed before production email delivery

---

### 2. Razorpay — Payment Gateway

**Purpose**: Process online payments (UPI, cards, net banking, wallets) for membership fees.

**Phase**: 4 (Payment Management)

**Integration Type**: 
- **Client**: Razorpay Checkout.js (drop-in payment modal)
- **Server**: Razorpay Node.js SDK for order creation and verification
- **Webhook**: Route Handler for payment confirmation

**Required Credentials**:
| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_ID` | Public key (safe for client) |
| `RAZORPAY_KEY_SECRET` | Secret key (server only) |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification secret |

**Payment Flow**:
```
1. Client clicks "Pay Online"
2. Server Action creates Razorpay Order (POST /v1/orders)
3. Client opens Razorpay Checkout with order ID
4. User completes payment in Razorpay modal
5. Razorpay sends webhook to /api/webhooks/razorpay
6. Webhook handler:
   a. Verifies HMAC-SHA256 signature
   b. Updates Payment status → COMPLETED
   c. Generates Invoice
   d. Queues payment receipt email
7. Client receives confirmation via polling or redirect
```

**Webhook Security**:
- Verify `X-Razorpay-Signature` header using HMAC-SHA256
- Idempotent processing (check if payment already processed)
- Log all webhook events for audit
- Return 200 immediately, process asynchronously

**Testing**:
- Use Razorpay Test Mode (test API keys)
- Test with Razorpay's test card numbers and UPI IDs
- Verify webhook with Razorpay's webhook tester

---

### 3. Object Storage (S3-compatible) — File Storage

**Purpose**: Store member progress photos, community post images, CMS media, invoice PDFs.

**Phase**: 1 (basic), expanded in Phase 6–7

**Provider Options** (choose one):
| Provider | Free Tier | Egress Cost | Notes |
|----------|-----------|-------------|-------|
| Cloudflare R2 | 10 GB/month | Free | Best value, S3-compatible |
| Supabase Storage | 1 GB | Included | Already using Supabase? Simplest. |
| AWS S3 | 5 GB (12 months) | Paid | Most mature |
| MinIO (self-hosted) | Unlimited | N/A | For local development |

**Required Credentials**:
| Variable | Description |
|----------|-------------|
| `S3_ENDPOINT` | Storage endpoint URL |
| `S3_REGION` | Region identifier |
| `S3_ACCESS_KEY_ID` | Access key |
| `S3_SECRET_ACCESS_KEY` | Secret key |
| `S3_BUCKET_NAME` | Bucket name |
| `S3_PUBLIC_URL` | Public URL prefix for public files |

**Bucket Structure**:
```
profitness-storage/
  avatars/          # Public — user profile photos
  progress/         # Private — member progress photos (signed URLs)
  media/            # Public — CMS uploaded media
  community/        # Public — community post images
  invoices/         # Private — generated PDF invoices
```

**Implementation**:
```
src/lib/storage/
  client.ts         # S3 client configuration (AWS SDK v3)
  upload.ts         # Upload helpers (signed URLs, direct upload)
  delete.ts         # Delete helpers
  url.ts            # Signed URL generation for private files
```

**Security**:
- Private buckets use pre-signed URLs (15-minute expiry)
- Upload validation: file type whitelist, max size (10 MB for images, 5 MB for documents)
- Server-side validation before generating signed upload URLs
- No direct client access to bucket credentials

---

### 4. Redis — Caching & Job Queues

**Purpose**: BullMQ job queues, session caching, rate limiting, leaderboard caching.

**Phase**: 1

**Provider Options**:
| Provider | Free Tier | Notes |
|----------|-----------|-------|
| Upstash Redis | 10K commands/day | Serverless, REST API available |
| Railway Redis | Limited free | Traditional Redis, good for BullMQ |
| Docker (local) | Unlimited | For development |

**Required Credentials**:
| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection URL (redis://...) |

**Usage**:
- BullMQ queues (email, notification, reports, scoring, cleanup)
- Rate limiting on auth endpoints (max 5 attempts/minute)
- Rate limiting on public forms (max 10 submissions/hour)
- Leaderboard cache (5-minute TTL)
- Session store (optional, Auth.js can use database)

---

## Future Integrations (Phase 10+)

### 5. WhatsApp Business API — Automated Messaging

**Purpose**: Send membership reminders, attendance nudges, and payment confirmations via WhatsApp.

**Phase**: Future (Phase 10+)

**Status**: NOT IMPLEMENTED. Requires WhatsApp Business API provider account.

**Provider Options**:
| Provider | Type | Notes |
|----------|------|-------|
| Meta Cloud API | Official | Direct integration, requires business verification |
| Twilio | BSP | Easier setup, per-message pricing |
| Gupshup | BSP | Popular in India, good pricing |
| Interakt | BSP | Designed for Indian businesses |

**Planned Use Cases**:
- Membership expiry reminder (7 days, 3 days, 1 day before)
- Payment confirmation
- Daily attendance nudge (if member hasn't checked in)
- Challenge start notification
- Welcome message after registration
- Comeback message after 7 days of inactivity

**Implementation Notes**:
- All WhatsApp messages must use pre-approved templates
- Messages will be queued through BullMQ (whatsapp queue)
- Rate limiting per member (max 2 messages/day)
- Opt-out mechanism required (TRAI regulations for India)
- Phone number must be in E.164 format (+91XXXXXXXXXX)

---

### 6. SMS Gateway — Backup Notifications

**Purpose**: Fallback for members who don't use WhatsApp. OTP delivery.

**Phase**: Future

**Status**: NOT IMPLEMENTED.

**Provider Options**:
| Provider | Notes |
|----------|-------|
| Twilio | International, reliable |
| MSG91 | Indian, cost-effective |
| Textlocal | Indian, simple API |

---

### 7. OpenAI API — AI Fitness Guidance

**Purpose**: AI-powered meal suggestions, workout guidance, habit coaching, and member Q&A.

**Phase**: Future (Phase 10)

**Status**: NOT IMPLEMENTED. Architecture is planned.

**Required Credentials**:
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | API key |
| `OPENAI_MODEL` | Default model identifier |

**Planned Use Cases**:
- Meal suggestions based on goal, diet preference, budget, and local food
- Workout Q&A (form guidance, exercise alternatives)
- Habit coaching (motivational nudges, consistency tips)
- Admin insights (retention analysis, engagement summaries)

**Safety Rules**:
- Always include disclaimer: "This is AI-generated guidance, not medical advice."
- Escalate injury, medical, pregnancy, and eating disorder queries to human trainer
- Rate limit AI usage per member (e.g., 20 queries/day)
- Store AI conversations for audit (with privacy policy consent)
- Never generate extreme diet prescriptions without trainer review

---

## Integration Testing Strategy

| Integration | Test Approach |
|------------|---------------|
| Resend | Use Resend test mode; verify email delivery in Resend dashboard |
| Razorpay | Use test API keys; test with Razorpay's test card/UPI IDs |
| Object Storage | Use MinIO in Docker for local/CI testing |
| Redis | Use Docker Redis for local/CI testing |
| WhatsApp | Mock in development; test with sandbox numbers |
| OpenAI | Mock responses in development; use real API in staging |

---

## Environment Variable Checklist

```bash
# === Core ===
DATABASE_URL=                    # PostgreSQL connection string
NEXTAUTH_URL=                    # App URL (http://localhost:3000 in dev)
NEXTAUTH_SECRET=                 # Random 32+ char secret

# === Email (Phase 1) ===
RESEND_API_KEY=
EMAIL_FROM=

# === Object Storage (Phase 1) ===
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
S3_PUBLIC_URL=

# === Redis (Phase 1) ===
REDIS_URL=

# === Payments (Phase 4) ===
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# === AI (Future) ===
OPENAI_API_KEY=
OPENAI_MODEL=

# === WhatsApp (Future) ===
WHATSAPP_API_URL=
WHATSAPP_API_KEY=
WHATSAPP_PHONE_NUMBER_ID=
```
