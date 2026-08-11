# PRO FITNESS OS — Security Plan

> **Version**: 0.1.0
> **Last Updated**: 2026-08-11
> **Status**: Planning

---

## Security Philosophy

1. **Defense in depth**: Multiple layers of security, never rely on a single check.
2. **Secure by default**: New features should be restrictive until explicitly opened.
3. **Principle of least privilege**: Users and services get minimum necessary access.
4. **Never trust the client**: All authorization and validation happens on the server.
5. **Fail closed**: If an authorization check fails or errors, deny access.

---

## Authentication Security

### Password Policy

| Policy | Value |
|--------|-------|
| Minimum length | 8 characters |
| Required | At least 1 uppercase, 1 lowercase, 1 digit |
| Hashing algorithm | bcrypt |
| bcrypt cost factor | 12 rounds |
| Password storage | Only bcrypt hash stored, never plaintext |
| Password reset | Token-based, expires in 1 hour, single use |
| Failed attempts | Rate limited: 5 per minute per IP |

### Session Security

| Policy | Value |
|--------|-------|
| Session type | Database-backed (not JWT) |
| Cookie flags | `HttpOnly`, `Secure`, `SameSite=Lax` |
| Session duration | 30 days, sliding window |
| Revocation | On password change, all sessions invalidated |
| Concurrent sessions | Allowed (max 5, oldest revoked) |

### Email Verification

- Required before first login
- Token: `crypto.randomUUID()`, stored hashed
- Expiry: 24 hours
- Single use: Token deleted after verification
- Resend cooldown: 60 seconds

### Password Reset

- Token: `crypto.randomUUID()`, stored hashed
- Expiry: 1 hour
- Single use: Marked as used after reset
- All existing sessions invalidated after password change
- Rate limited: 3 reset requests per hour per email

---

## Authorization Security

### Server-Side Enforcement

Every protected operation checks authorization on the server:

```typescript
// Server Action example
async function deletePayment(paymentId: string) {
  const session = await auth();
  if (!session) throw new AuthenticationError();

  authorize(session, 'payment:refund'); // Throws if unauthorized

  // ... proceed with business logic
}
```

### Middleware Protection

```typescript
// Route-level protection in middleware.ts
const protectedPatterns = [
  { path: '/admin/**', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/trainer/**', roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'] },
  { path: '/member/**', roles: ['SUPER_ADMIN', 'ADMIN', 'MEMBER'] },
];
```

### Data-Level Authorization

- Members can only access their own data (profile, progress, payments)
- Trainers can only access their assigned members' data
- Admins can access all data
- Progress photos are private by default (member + assigned trainer + admin only)
- Community posts respect Confidence Mode (anonymous mode for hesitant members)

---

## Input Validation

### Server-Side Validation (Mandatory)

All inputs are validated using Zod schemas on the server:

```typescript
const createMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().regex(/^\+91\d{10}$/).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
});
```

### Validation Rules

| Input Type | Validation |
|-----------|------------|
| Email | Format check, lowercase normalization, max 254 chars |
| Phone | Indian format: +91 followed by 10 digits |
| Names | 2-100 characters, no script injection |
| Passwords | Min 8 chars, complexity requirements |
| IDs | cuid format validation |
| Monetary amounts | Decimal, min 0, max 10,000,000 |
| File uploads | Type whitelist, max size, virus scan (future) |
| Free text | Max length, sanitized for display |

### Client-Side Validation (Optional, UX Only)

Client validation is for UX convenience. It is **never** a substitute for server validation.

---

## CSRF Protection

- **Server Actions**: Built-in CSRF protection via Next.js
- **Route Handlers**: Custom CSRF token for state-changing operations
- **Webhook endpoints**: Exempt from CSRF (use signature verification instead)
- **Cookie**: `SameSite=Lax` prevents cross-origin form submissions

---

## XSS Protection

| Measure | Implementation |
|---------|---------------|
| React auto-escaping | All JSX content is auto-escaped |
| No `dangerouslySetInnerHTML` | Never use unless rendering admin-controlled CMS HTML |
| Content Security Policy | CSP headers via `next.config.ts` |
| Sanitization | CMS rich text sanitized with DOMPurify before render |

### Content Security Policy

```typescript
// next.config.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' blob: data: https://*.r2.cloudflarestorage.com;
  connect-src 'self' https://api.razorpay.com https://lumberjack-cx.razorpay.com;
  frame-src https://api.razorpay.com;
`;
```

---

## SQL Injection Protection

- **Prisma ORM**: All queries are parameterized by default
- **No raw SQL**: Unless absolutely necessary and explicitly documented
- **If raw SQL is needed**: Use `Prisma.$queryRaw` with tagged template literals (parameterized)

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 1 minute |
| Registration | 3 attempts | 1 minute |
| Password reset request | 3 attempts | 1 hour |
| Email verification resend | 1 attempt | 60 seconds |
| Public contact form | 10 submissions | 1 hour |
| AI chat (future) | 20 queries | 1 day |

**Implementation**: Redis-backed rate limiting using a sliding window algorithm.

```typescript
// Example using ioredis
async function rateLimit(key: string, max: number, windowSeconds: number) {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  if (current > max) {
    throw new RateLimitError();
  }
}
```

---

## Webhook Security

### Razorpay Webhooks

```typescript
// Verify webhook signature
function verifyRazorpaySignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Rules**:
- Verify HMAC-SHA256 signature on every webhook
- Use `crypto.timingSafeEqual` for timing-attack-safe comparison
- Return 200 immediately, process asynchronously
- Idempotent processing (dedup by razorpayPaymentId)
- Log all webhook events

---

## Secrets Management

### Environment Variables

| Category | Variable | Location |
|----------|----------|----------|
| Database | `DATABASE_URL` | Server only |
| Auth | `NEXTAUTH_SECRET` | Server only |
| Email | `RESEND_API_KEY` | Server only |
| Payments | `RAZORPAY_KEY_SECRET` | Server only |
| Payments | `RAZORPAY_WEBHOOK_SECRET` | Server only |
| Storage | `S3_SECRET_ACCESS_KEY` | Server only |
| Redis | `REDIS_URL` | Server only |
| Payments | `RAZORPAY_KEY_ID` | Client safe (via `NEXT_PUBLIC_`) |
| App URL | `NEXT_PUBLIC_APP_URL` | Client safe |

### Rules

1. **Never commit `.env.local`** — must be in `.gitignore`
2. **Never log secrets** — redact in error messages
3. **Never expose server-only env vars to the client** — only `NEXT_PUBLIC_*` prefix is safe
4. **Rotate secrets** if compromised — Auth.js secret, Razorpay keys, API keys
5. **Use Vercel Environment Variables** for production — scoped to production/preview/development

---

## Audit Logging

### What Is Logged

| Category | Actions |
|----------|---------|
| Authentication | Login success, login failure, registration, password reset, email verification |
| Member management | Create, update, suspend, soft-delete member |
| Membership | Assign, renew, cancel, freeze membership |
| Payments | Record payment, refund payment |
| Invoices | Generate, cancel invoice |
| Staff | Add staff, change role, remove staff |
| CMS | Edit page, edit section, upload media |
| Settings | Change system settings |
| Authorization | Access denied events |

### Audit Log Schema

```typescript
{
  userId: string;        // Who performed the action
  action: string;        // What was done (e.g., "member.create")
  entityType: string;    // What type of entity was affected
  entityId: string;      // Which entity was affected
  changes: object;       // Before/after diff (for updates)
  ipAddress: string;     // Request IP
  userAgent: string;     // Browser/client info
  createdAt: DateTime;   // When it happened (immutable)
}
```

### Immutability

- Audit logs are **append-only**. No update or delete operations are allowed.
- Audit logs are **never exposed to non-admin users**.
- Retention: Keep indefinitely (or archive after 2 years).

---

## File Upload Security

| Check | Value |
|-------|-------|
| Allowed image types | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Allowed document types | `application/pdf` |
| Max file size (images) | 10 MB |
| Max file size (documents) | 5 MB |
| Filename sanitization | Strip special characters, generate UUID-based names |
| Storage | Private bucket for progress photos, public bucket for CMS |
| Access | Signed URLs for private files (15-minute expiry) |
| Validation | Server-side MIME type check (not just extension) |

---

## HTTP Security Headers

```typescript
// next.config.ts headers
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '0',  // Deprecated, rely on CSP instead
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}
```

---

## Dependency Security

- Run `npm audit` in CI pipeline
- Address critical and high vulnerabilities before deployment
- Pin major dependency versions
- Review new dependencies before installation:
  - Check download counts and maintenance status
  - Check for known vulnerabilities
  - Prefer established packages over new ones

---

## Data Privacy

### Member Data

- Progress photos are private by default
- Confidence Mode members have private profiles
- Members can request data export (future GDPR-like compliance)
- Members can request account deletion (soft delete with data anonymization)

### AI Conversations (Future)

- AI conversation history is visible only to the member and admin
- Conversations are not used for training third-party AI models
- AI disclaimer is shown before every AI interaction

---

## Incident Response Plan

### If Credentials Are Leaked

1. Immediately rotate the compromised credential
2. Check audit logs for unauthorized access during exposure window
3. Invalidate all active sessions if auth secret was compromised
4. Notify affected users if personal data was potentially accessed
5. Document the incident and root cause

### If Database Is Compromised

1. Passwords are bcrypt-hashed (not reversible)
2. Force password reset for all users
3. Rotate all API keys and secrets
4. Review and close the attack vector
5. Notify affected users

---

## Security Checklist for Code Reviews

- [ ] Server-side authorization check on every protected action
- [ ] Zod validation on all inputs
- [ ] No raw SQL without parameterization
- [ ] No secrets in client code
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] File uploads validated for type and size
- [ ] Rate limiting on public-facing endpoints
- [ ] Audit log entry for sensitive operations
- [ ] Error messages don't expose internal details
- [ ] No user-controlled data in error logs without sanitization
