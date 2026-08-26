# PRO FITNESS OS Deployment Guide

## Overview
PRO FITNESS OS is a Next.js + PostgreSQL + Prisma application. This guide outlines the steps required to deploy the application for production.

> [!WARNING]
> **DEFERRED FEATURES**: Physical MB20 installation and Razorpay integration are deferred and not included in this deployment phase.
>
> **DEPLOYMENT LIMITATIONS**:
> - **Background Jobs**: Runs an in-memory queue. Horizontal scaling will result in duplicate job execution.
> - **Media Storage**: Uses `LocalStorageAdapter` by default. If deploying to an ephemeral environment (like Vercel or Docker without volume mounts), uploaded photos/files will be lost on container restart. A persistent storage volume is required.

## Prerequisites
- **Node.js**: v18.x or v20.x
- **PostgreSQL**: v14+
- **Environment**: A secure hosting environment (e.g., Vercel, AWS ECS, or a VPS with PM2)

## Environment Variables
Ensure the following are set in the production environment (`.env`):
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
NEXTAUTH_SECRET="your-secure-random-secret"
NEXTAUTH_URL="https://your-production-url.com"
```
*Note: The application will fail to start if core variables are missing, thanks to Zod validation.*

## Database Migration Process
Do NOT run `prisma migrate dev` or `prisma migrate reset` in production.
Use the following safely:
```bash
npx prisma migrate deploy
```
This applies pending migrations without resetting the database.

## Prisma Generation
Generate the Prisma Client before building the application:
```bash
npx prisma generate
```

## Build Process
Build the Next.js application:
```bash
npm run build
```

## Startup Process
Start the production server:
```bash
npm run start
```
For process management on a VPS, use PM2:
```bash
pm2 start npm --name "profitness" -- run start
```

## Health and Readiness Checks
Configure your load balancer or orchestration tool to poll these endpoints:
- **Liveness**: `GET /api/health` - Returns 200 OK when the process is alive.
- **Readiness**: `GET /api/ready` - Returns 200 OK when the database is connected and config is valid.

## Rollback Considerations
- Always take a database backup before applying `migrate deploy`.
- If a deployment fails, revert to the previous container/build.
- If a schema change is destructive, refer to `operations.md` for restore procedures.
