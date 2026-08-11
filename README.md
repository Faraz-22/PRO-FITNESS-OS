# PRO FITNESS OS

A production-grade Gym Management and CRM platform built with Next.js, Prisma, and Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js (v22+)
- Docker & Docker Compose (for local database & Redis)

### Local Development Setup

1. **Start the database and Redis**:
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   The local `.env` file is already set up to connect to the Docker containers. For a production deployment, copy `.env.example` to `.env` and fill in the production values.

4. **Initialize the database**:
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [Development Roadmap](docs/ROADMAP.md)
- [Security Plan](docs/SECURITY.md)
- [Integrations](docs/INTEGRATIONS.md)

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js (NextAuth v5)
- **Background Jobs**: BullMQ + Redis
