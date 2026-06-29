# NADMO-WMS

NADMO Integrated Warehouse & Logistics Management System — a modern, secure, PWA-ready web application for coordinating disaster relief logistics across Ghana.

## Overview

NADMO-WMS connects HQ, regional, and district warehouses into a single real-time logistics platform. It provides inventory management, inter-warehouse transfers, digital waybills, alerts, audit trails, and national visibility.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage)
- **Maps**: OpenStreetMap / Leaflet.js
- **SMS**: Arkesel (Ghana)
- **Hosting**: Vercel (MVP) with migration path to sovereign hosting

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase CLI (optional, for local backend)
- A Supabase project

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

1. Apply migrations to your Supabase project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

2. Seed demo data:

```bash
supabase db reset  # includes seed.sql
```

> Note: `supabase db reset` will erase existing data. Use with caution in production.

### Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a demo account:

| Email | Role | Password |
|-------|------|----------|
| `dg@nadmo.gov.gh` | Director-General | `NadmoWMS2026!` |
| `hq.logistics@nadmo.gov.gh` | HQ Logistics | `NadmoWMS2026!` |
| `regional.ashanti@nadmo.gov.gh` | Regional Manager | `NadmoWMS2026!` |
| `district.tema@nadmo.gov.gh` | District Officer | `NadmoWMS2026!` |
| `auditor@nadmo.gov.gh` | Auditor | `NadmoWMS2026!` |

### Build for Production

```bash
npm run build
```

## Project Structure

```
app/                    # Next.js App Router pages
components/             # React components
  ui/                   # shadcn/ui components
  layout/               # App shell, sidebar, topbar
  dashboard/            # Dashboard widgets
  inventory/            # Inventory forms and tables
  transfers/            # Transfer forms and timeline
lib/                    # Utilities, auth helpers, Supabase clients
supabase/
  migrations/           # Database migrations
  functions/            # Edge Functions (SMS, waybill, transfer)
  seed.sql              # Demo data
types/                  # TypeScript type definitions
public/                 # Static assets, PWA manifest
```

## Deployment

### Vercel + Supabase Cloud (MVP)

1. Push code to GitHub.
2. Import repository in Vercel.
3. Add environment variables in Vercel dashboard.
4. Deploy.

### Supabase Edge Functions

Deploy Edge Functions:

```bash
supabase functions deploy send-sms
supabase functions deploy generate-waybill
supabase functions deploy create-transfer
```

Set secrets:

```bash
supabase secrets set ARKESEL_API_KEY=your-arkesel-api-key
```

## Security

- Row-Level Security (RLS) enforced on all tables
- JWT-based authentication via Supabase Auth
- Role-based access control (RBAC)
- Immutable audit log with hash chaining
- HTTPS/TLS 1.3 in production

## Compliance

Designed to align with:

- Ghana Data Protection Act 2012 (Act 843)
- NITA ICT standards
- Public Financial Management Regulations
- UN OCHA humanitarian data principles

## Roadmap

See [ARCHITECTURE.md](../ARCHITECTURE.md) and [NADMO_WMS_PRD.md](../NADMO_WMS_PRD.md) for full details.

## License

Confidential — For Government Review. All data and intellectual property owned by NADMO / Government of Ghana.
