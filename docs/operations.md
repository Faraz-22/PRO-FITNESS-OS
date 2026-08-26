# PRO FITNESS OS Operations Guide

## Overview
This document covers the day-to-day operations, monitoring, and maintenance of PRO FITNESS OS.

> [!WARNING]
> **DEFERRED FEATURES**: Physical MB20 installation and Razorpay integration are deferred.

## Backup and Restore Strategy
- **Backup Strategy**: Configure automated `pg_dump` jobs running at least daily. Store backups securely in an offsite location (e.g., AWS S3).
- **Restore Strategy**: 
  - Stop application traffic.
  - Run `pg_restore` against a clean database instance.
  - Verify data integrity.
  - Update `DATABASE_URL` and resume traffic.

## Database Migration Safety
- Never use `prisma migrate reset` in production.
- Always use `prisma migrate deploy`.
- All schema changes must be additive to prevent downtime and data loss.

## Monitoring & Logs
- **Logs**: The application uses a structured JSON logger (via `src/lib/logging/logger.ts`). Collect these logs using Datadog, AWS CloudWatch, or an ELK stack.
- **Health Checks**: Monitor `/api/health` and `/api/ready` continuously.

## Background Jobs
> [!WARNING]
> **DEPLOYMENT LIMITATION**: PRO FITNESS OS currently uses an in-memory job runner. This works perfectly for a single-instance deployment (e.g. single VPS). If you horizontally scale the application across multiple container instances, jobs may execute multiple times simultaneously. Distributed scheduling (Redis/BullMQ) is deferred to a future phase.

Background jobs run automatically to keep the system state synchronized.
- **Membership Expiry Job**: Syncs membership status (`ACTIVE` -> `EXPIRED`) based on timezone-aware dates.
- **Finance Jobs**: Transitions invoices to `OVERDUE` if the due date has passed.
- **Notification Jobs**: Purges old, read notifications.

## Common Failures & Troubleshooting
- **Database Connection Error**: The `/api/ready` endpoint will return 503. Check PostgreSQL credentials and network rules.
- **Missing Configuration**: Application will throw an error on boot due to Zod validation in `env.ts`.
- **Invalid Auth Secret**: NextAuth will fail to issue sessions. Ensure `NEXTAUTH_SECRET` matches across instances.
