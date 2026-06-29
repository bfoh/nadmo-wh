---
title: "NADMO Integrated Warehouse & Logistics Management System (NADMO-WMS)"
subtitle: "Product Requirements Document — Version 2.0"
author: "Solutions Architecture Team"
date: "June 2026"
---

# NADMO Integrated Warehouse & Logistics Management System (NADMO-WMS)

**Product Requirements Document — Version 2.0**

*Classification: Confidential — For Government Review*
*Date: June 2026*
*Prepared for: National Disaster Management Organisation (NADMO), Republic of Ghana*

---

## Document Control

| Field | Value |
|-------|-------|
| **Document Title** | NADMO Integrated Warehouse & Logistics Management System (NADMO-WMS) PRD |
| **Version** | 2.0 |
| **Status** | Final Draft |
| **Classification** | Confidential — For Government Review |
| **Author** | Solutions Architecture Team |
| **Review Cycle** | Technical, Security, Compliance, Executive |
| **Target Audience** | NADMO Leadership, Ministry of Interior, NITA, Development Partners, Vendor Teams |

## Table of Contents

1. Strategic Context & Problem Statement
2. Product Vision
3. Product Form Factor
4. Target Users & Personas
5. Product Value Proposition
6. Scope Boundaries
7. Real-World Use Cases
8. Core User Flow
9. System Architecture
10. Feature Inventory
11. Key Page Layouts
12. Detailed Module Specifications
13. Data Model
14. API Design
15. Security Architecture
16. Compliance & Governance
17. Design System & User Experience
18. Connectivity Resilience
19. Ghana National Map & GIS
20. Copy & Language Standards
21. Non-Functional Requirements
22. Implementation Roadmap
23. Success Metrics & KPIs
24. Risk Register
25. Quality Assurance & Testing Strategy
26. Training & Change Management
27. Support & Maintenance
28. Budget & Estimation Framework
29. SMS Notification Templates
30. Bulk Data Import Specifications
31. Open Items & Decisions Log
32. Appendices
33. Conclusion

---

## Executive Summary

The **NADMO Integrated Warehouse & Logistics Management System (NADMO-WMS)** is a sovereign, secure, and intelligent enterprise platform designed to transform Ghana’s national disaster preparedness and response capability. It will connect every NADMO warehouse — from the national strategic stockpile in Greater Accra through all 16 regional hubs to all 261 district warehouses — into a single, real-time logistics nervous system.

Unlike fragmented spreadsheet tracking, paper registers, or phone-based coordination, NADMO-WMS provides:

- **Total Visibility**: Real-time stock levels, movements, and status across every warehouse, accessible from headquarters to the district level.
- **Intelligent Coordination**: AI-assisted demand forecasting, automated stock redistribution recommendations, and smart approval workflows.
- **Immovable Accountability**: An immutable, append-only audit trail for every item movement, user action, and decision.
- **Field-Ready Operations**: Progressive Web App (PWA) and future native mobile app with offline sync, barcode/QR scanning, GPS tracking, and digital signatures.
- **Government-Grade Security**: End-to-end encryption, role-based access control (RBAC), multi-factor authentication (MFA), and full compliance with Ghana’s Data Protection Act and NITA standards.

This document defines the product vision, functional and non-functional requirements, system architecture, data model, security framework, compliance posture, implementation roadmap, and success metrics for delivering an award-winning, procurement-ready government logistics platform.

---

## 1. Strategic Context & Problem Statement

### 1.1 National Context

Ghana faces a diverse and intensifying disaster risk profile, including:

- **Flooding** — annual seasonal flooding in northern, central, and coastal regions
- **Droughts and food insecurity** — particularly in northern savannah zones
- **Bush and industrial fires** — across urban and rural districts
- **Earthquakes and seismic risks** — especially in Accra and the southeast
- **Epidemics and public health emergencies** — cholera, meningitis, COVID-19-type events
- **Storm surges and coastal erosion** — affecting fishing communities

NADMO is the statutory lead agency for disaster prevention, preparedness, response, and recovery. Effective response depends on the right relief materials being in the right place at the right time — a challenge that current manual processes cannot reliably meet.

### 1.2 Current Pain Points

| Pain Point | Operational Impact | Risk to Lives |
|------------|--------------------|---------------|
| Paper-based stock registers | Delayed reporting, transcription errors, lost records | Supplies may not arrive where needed |
| No real-time national visibility | HQ cannot see regional/district stock during emergencies | Slow, reactive response |
| Manual phone/WhatsApp coordination | Miscommunication, no audit trail, duplication | Resources misallocated |
| No predictive stock planning | Stockouts before disasters; waste from overstocking | Communities left without aid |
| Weak audit trail | Pilferage, disputes, donor reporting gaps | Loss of public and donor trust |
| Limited field mobility | Field officers cannot update systems in real time | Delays in confirming receipts/dispatch |

### 1.3 Strategic Objectives

| # | Objective | Measurable Outcome |
|---|-----------|--------------------|
| 1 | Establish a single source of truth for all NADMO warehouse stock | 100% of warehouses digitised within 12 months |
| 2 | Enable real-time visibility of stock and movements nationwide | Dashboard refreshed within 5 minutes of any transaction |
| 3 | Reduce response time to disaster-affected communities | 50% reduction in dispatch-to-delivery time within 18 months |
| 4 | Strengthen accountability and reduce losses | 100% traceability of all items; zero unrecorded movements |
| 5 | Improve donor and government reporting | Donor-ready reports generated in under 2 minutes |
| 6 | Build institutional resilience and capacity | 90%+ user adoption across all warehouses within 6 months of rollout |

---

## 2. Product Vision

> **To make NADMO the most transparent, responsive, and technologically advanced disaster logistics organisation in West Africa — where every relief item is tracked, every movement is visible, and no community is left waiting because of information failure.**

---

## 3. Product Form Factor

### 3.1 Primary Delivery: Progressive Web Application (PWA)

| Item | Detail |
|------|--------|
| **Selected Form** | Progressive Web App (PWA) |
| **Rationale** | Single codebase; works on desktop, tablet, and mobile; offline-capable; no app store dependency; government IT can self-host |
| **First-Class Devices** | Desktop at HQ/Regional offices; Android tablets at district warehouses; smartphones for field supervisors |
| **Phase 2** | Native Android/iOS apps with full offline synchronisation and hardware barcode scanning |
| **Phase 3** | Deep integration with Ghana Government ERP (GIFMIS), NEMA, Ghana Meteorological Agency, Ghana Health Service, and donor systems |

### 3.2 Why PWA for Government

- **Sovereignty**: No dependency on Apple/Google app stores for deployment or updates.
- **Reach**: Works on the lowest common denominator devices already in use.
- **Resilience**: Service workers enable offline data capture and background sync.
- **Maintainability**: One codebase reduces total cost of ownership (TCO).
- **Security**: Served over HTTPS with controlled deployment pipelines.

---

## 4. Target Users & Personas

| Role | Profile | Core Pain Today | Key Needs |
|------|---------|-----------------|-----------|
| **Director-General / HQ Executive** | Senior NADMO official; strategic decision-maker; presents to Cabinet and donors | No real-time national visibility; relies on phone calls and weekly reports | National dashboard, one-click reports, critical alerts, drill-down to district |
| **HQ Logistics & Procurement Officer** | Coordinates national stock, procurement, and large transfers | Cannot track in-transit shipments; no automated low-stock alerts | Transfer order management, vehicle tracking, procurement triggers, stock forecasting |
| **Regional Warehouse Manager** | Manages regional hub + supervises district warehouses in region | No structured way to receive/dispatch; paper records | Regional dashboard, district oversight, approval workflows, discrepancy resolution |
| **District Warehouse Officer** | Frontline officer at district capital warehouse | No digital tools; notebook records; delays during crises | Mobile-friendly stock intake/dispatch, QR scanning, receipt confirmation, offline sync |
| **Field Response Officer** | Deploys to disaster sites with relief materials | Cannot update status in the field | Mobile dispatch confirmation, GPS tracking, photo evidence, digital signatures |
| **Auditor / Finance Officer** | Reviews inventory records and asset utilisation | Manual reconciliation takes weeks; weak audit trail | Immutable audit logs, exception reports, valuation reports, donor reconciliation |
| **System Administrator (NITA/NADMO IT)** | Manages users, roles, security | Needs enterprise-grade controls | RBAC, MFA, audit logs, backups, API management |

---

## 5. Product Value Proposition

### 5.1 For Users

- **Real-time visibility** of every item across every warehouse, from Paga to Axim.
- **Automated alerts** when stock falls below critical thresholds — before disasters strike.
- **Digital audit trail** — no lost paperwork, no disputed records, no unaccounted movements.
- **Field-ready interface** that works on basic Android tablets and smartphones, even with poor connectivity.
- **Intelligent recommendations** for stock redistribution based on disaster risk, seasonality, and consumption patterns.

### 5.2 For Government of Ghana

- Positions NADMO as a modern, accountable, data-driven institution.
- Reduces waste, pilferage, and expiry losses through full traceability and FEFO (First-Expiry-First-Out) logic.
- Supports national disaster preparedness planning with evidence-based pre-positioning.
- Strengthens inter-agency coordination with standardised data sharing.

### 5.3 For Development Partners & Donors

- Instant, donor-ready reports in World Bank, UN OCHA, USAID, and EU formats.
- Full transparency on utilisation of donated goods.
- Verifiable impact metrics for disaster response operations.

---

## 6. Scope Boundaries: What We Are NOT Building

| Out of Scope | Reason | Future Integration Point |
|--------------|--------|--------------------------|
| Financial payments / procurement invoicing | Handled by GIFMIS and NADMO finance | API integration in Phase 3 |
| HR management and payroll | Separate NADMO HR systems | SSO integration possible |
| Disaster incident command & field operations | Separate CAD/incident management system | Incident-linking module in Phase 2 |
| Public-facing citizen portal | Not part of v1; requires policy approval | Phase 3 citizen feedback module |
| Full IoT sensor network | Cold-chain monitoring; phased due to hardware cost | Phase 2 for strategic warehouses |
| National ID integration | Outside logistics scope; NIA integration optional | Phase 3 for beneficiary verification |

---

## 7. Real-World Use Cases

### Use Case 1: Flood Early Response (District Officer)

A district officer in Accra Metro receives a dispatch order from HQ for 200 emergency food packs. She logs into NADMO-WMS on her tablet, scans the QR codes on the arriving pallets, confirms receipt, updates stock levels, and captures a digital signature. The system automatically notifies HQ and the regional manager. The entire transaction is timestamped and geo-tagged.

### Use Case 2: National Stock Audit (Director-General)

The Director-General opens NADMO-WMS before a Cabinet briefing. A single national dashboard shows total stock across all warehouses, items in transit, warehouses below critical threshold (flagged red), and the last 30 days of movement history — all without calling a single officer. He exports a donor-ready PDF in two clicks.

### Use Case 3: Cross-Region Emergency Transfer (HQ Logistics)

After a major flooding event in Bono Region, HQ logistics redistributes 1,000 emergency tents from the Greater Accra central warehouse to Sunyani. The officer creates a transfer order, the system routes it for approval based on value/quantity rules, assigns a vehicle and driver, and generates a digital waybill with QR code. The receiving warehouse scans the waybill on arrival. The in-transit shipment is tracked on a live map until confirmed delivery.

### Use Case 4: Predictive Pre-Positioning (HQ Analyst)

Before the rainy season, the system’s analytics engine recommends pre-positioning additional water purification tablets and tarpaulins in the Upper East, Savannah, and Northern regions based on historical flood patterns, current stock levels, and seasonal risk indices. HQ approves the recommendation and dispatches materials accordingly.

### Use Case 5: Discrepancy Resolution (Regional Manager)

A district warehouse reports receiving 180 blankets instead of 200 dispatched. The system automatically flags a discrepancy, notifies the regional manager and HQ logistics, and triggers a digital reconciliation workflow. Photos, driver statements, and witness signatures are attached before the case is closed.

---

## 8. Core User Flow

```
User Authenticates (Username + Password + TOTP)
    ├── Director-General        → National Command Dashboard
    ├── HQ Logistics Officer    → Logistics Operations Centre
    ├── Regional Manager        → Regional Dashboard
    ├── District Officer        → District Warehouse View
    ├── Field Officer           → Field Dispatch/Receipt View
    └── Auditor                 → Audit & Reports Centre

National Dashboard
    └── Initiate Transfer Order
            └── Smart Approval Workflow (auto-routed by value/quantity)
                    └── Approved → Generate Digital Waybill (PDF + QR)
                            └── Assign Vehicle + Driver
                                    └── Shipment In-Transit (GPS Live Map)
                                            ├── Received → Scan Waybill → Confirm Quantities → Digital Signature
                                            │       └── Stock Updated → Audit Trail Logged
                                            │               ├── Stock OK → Green Status
                                            │               └── Stock Low → Critical Alert to HQ + Regional
                                            ├── Overdue → Auto-Escalation Alert
                                            └── Discrepancy → Photo Evidence → Reconciliation Workflow
```

---

## 9. System Architecture

### 9.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  HQ Desktop  │  │ Regional Tab │  │ District Mob │  │ Field Officer│            │
│  │  Dashboard   │  │    let       │  │    ile PWA   │  │    App       │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                  │                  │
│         └──────────────────┴──────────────────┴──────────────────┘                  │
│                                     PWA / React / Next.js                            │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼ HTTPS / TLS 1.3
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              EDGE / CDN LAYER                                        │
│         Vercel Edge / Cloudflare / Government CDN — Static Assets, Caching           │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │  Next.js App    │  │  Supabase Edge  │  │  Background     │  │   SMS/API    │   │
│  │  Router (SSR)   │  │  Functions      │  │  Workers        │  │   Gateways   │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────┘   │
│         │                    │                    │                    │            │
│         └────────────────────┴────────────────────┴────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            DATA & SERVICES LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │  PostgreSQL     │  │  Supabase       │  │  Redis Cache    │  │  Object      │   │
│  │  (Primary DB)   │  │  Realtime       │  │  (Session/Cache)│  │  Storage     │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────┘   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │  TimescaleDB    │  │  ML/Analytics   │  │  GPS Tracking   │  │  Audit Log   │   │
│  │  (Time-series)  │  │  Engine         │  │  Service        │  │  Store       │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL INTEGRATION LAYER                                   │
│  Arkesel SMS  │  GhanaPost GPS  │  OpenStreetMap  │  NEMA/Met Agency  │  GIFMIS     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS | Server-side rendering, PWA support, excellent developer ecosystem |
| **State Management** | Zustand + TanStack Query | Lightweight, optimised for server-state and caching |
| **UI Components** | shadcn/ui + Radix UI | Accessible, customisable, government-grade design system |
| **Backend** | Supabase (PostgreSQL + PostgREST + GoTrue) | Open-source, self-hostable, built-in RLS, real-time subscriptions |
| **Edge Functions** | Supabase Edge Functions (Deno) | Low-latency serverless functions for SMS, PDF generation, integrations |
| **Database** | PostgreSQL 15+ with Row-Level Security | ACID compliance, rich JSON support, geospatial extensions (PostGIS) |
| **Time-Series** | TimescaleDB extension | Optimised for tracking stock levels, movements, and sensor data over time |
| **Caching** | Redis / Upstash | Session storage, dashboard cache, rate limiting |
| **Object Storage** | Supabase Storage / MinIO | Waybill PDFs, signatures, photos, import files |
| **Maps** | Mapbox GL JS / Leaflet + OpenStreetMap | Ghana boundary data, offline-capable, no licensing lock-in |
| **GPS Tracking** | Custom GPS service + GhanaPost GPS integration | Vehicle tracking, geofencing, route optimisation |
| **SMS** | Arkesel API | Ghana-local provider, branded sender ID, reliable delivery |
| **Email** | Resend / AWS SES / Government SMTP | Transactional and scheduled reports |
| **Monitoring** | Sentry + Logflare + UptimeRobot | Error tracking, performance monitoring, uptime alerts |
| **CI/CD** | GitHub Actions | Automated testing, security scanning, deployment |

### 9.3 Deployment Strategy

| Phase | Environment | Hosting | Notes |
|-------|-------------|---------|-------|
| Phase 1 (Months 1–6) | Production + Staging | Vercel + Supabase Cloud | Rapid deployment, automatic scaling, global CDN |
| Phase 2 (Months 7–12) | GovTech Ghana Migration Readiness | Containerised deployment (Docker/Kubernetes) | Portable, air-gappable, sovereign data option |
| Phase 3 (Year 2+) | Sovereign / Hybrid Cloud | Government Data Centre or accredited local cloud | Full data residency, NITA compliance |

### 9.4 Portability & Sovereignty

The architecture is intentionally cloud-agnostic:

- No vendor-proprietary runtime features.
- All infrastructure endpoints injected via environment variables.
- Database schema is standard PostgreSQL with no Supabase-specific lock-in.
- Supabase stack is fully open-source and self-hostable.
- Migration path: DNS cutover → container deployment → data export/import → SSL provisioning → security audit → go-live.

---

## 10. Feature Inventory

### 10.1 CORE (MVP — Must Have for Launch)

```
NADMO-WMS
├── Module 1: Authentication, Identity & Access Management
│   ├── Secure login (username + password + TOTP 2FA)
│   ├── Role-based access control (RBAC) with least privilege
│   ├── Single Sign-On (SSO) readiness (SAML 2.0 / OIDC)
│   ├── Session timeout + concurrent session control
│   ├── Password policy enforcement (min 12 chars, complexity, 90-day expiry)
│   ├── Activity logging for all authentication events
│   └── Account deactivation / suspension workflows
│
├── Module 2: National Command Dashboard (HQ)
│   ├── Real-time national stock map (Ghana choropleth — regions + districts)
│   ├── KPI tiles: Total SKUs, In-Transit shipments, Critical-stock warehouses, Active transfers
│   ├── Critical stock alerts panel (red/amber/green threshold indicators)
│   ├── Recent activity feed (last 100 transactions nationwide)
│   ├── Quick-action buttons: Initiate Transfer, Raise Alert, Export Report
│   ├── Drill-down: National → Regional → District → Warehouse
│   └── Executive briefings generator (one-click PDF summary)
│
├── Module 3: Regional & District Warehouse Dashboards
│   ├── Regional view of all district warehouses in region
│   ├── District warehouse operational view
│   ├── Stock-on-hand by SKU category
│   ├── Incoming/outgoing transfer queues
│   ├── Local alert panel and notification centre
│   └── Performance scorecard (receipt timeliness, accuracy)
│
├── Module 4: Warehouse Inventory Management
│   ├── Stock intake (receive from HQ / external supplier / donor)
│   ├── Stock dispatch (outbound to field / another warehouse / disaster site)
│   ├── Real-time stock level per SKU per warehouse
│   ├── Stock adjustment (write-off, damage, expiry, correction with mandatory reason)
│   ├── Batch/lot tracking and expiry date management (FEFO)
│   ├── Barcode / QR code generation and scanning (PWA camera + optional Bluetooth scanner)
│   ├── Minimum stock threshold configuration per warehouse per SKU
│   └── Cycle count and physical stock reconciliation
│
├── Module 5: Transfer Order & Waybill Management
│   ├── Create transfer order (source → destination warehouse)
│   ├── Hierarchical approval workflow (District → Regional → HQ → Director)
│   ├── Digital waybill generation (PDF export with QR code and barcode)
│   ├── Vehicle and driver assignment
│   ├── In-transit status tracking with GPS live map
│   ├── Receipt confirmation + digital signature + photo capture
│   ├── Discrepancy reporting and reconciliation workflow
│   └── Delivery SLA monitoring with auto-escalation
│
├── Module 6: Alerts & Notifications
│   ├── Critical stock level alerts (configurable thresholds)
│   ├── Overdue shipment alerts (configurable SLA hours)
│   ├── Discrepancy alerts (escalated to regional + HQ)
│   ├── Approval SLA breach alerts
│   ├── In-app notification centre
│   ├── SMS notifications via Arkesel
│   ├── Email notifications for reports and escalations
│   └── Push notifications (PWA + future native app)
│
├── Module 7: Hierarchical Supervision & Audit Trail
│   ├── Full immutable transaction log (who, what, when, from where, IP)
│   ├── HQ supervisory view — drill down: National → Regional → District
│   ├── Stock movement history per SKU per warehouse
│   ├── User activity log (login, edits, exports, approvals)
│   ├── Audit log exports (PDF/CSV) for auditors
│   └── Tamper-evident log hashing
│
└── Module 8: Master Data Management
    ├── SKU catalogue (manual entry + bulk import)
    ├── Item categorisation (Food / Shelter / Medical / Equipment / PPE / Water & Sanitation)
    ├── Unit of measure configuration
    ├── Item photos, descriptions, and hazard classifications
    ├── Warehouse directory (HQ, 16 regional, 261 district warehouses)
    ├── Warehouse profile (address, capacity, manager, contact, GPS coordinates)
    ├── Regional hierarchy mapping
    └── User directory and role assignment
```

### 10.2 IMPORTANT (Post-Launch Iterations — Months 4–9)

```
├── Module 9: Reporting & Business Intelligence
│   ├── Predefined reports: Stock Status, Movement History, Low Stock, Transfer Summary
│   ├── Scheduled report delivery (daily/weekly/monthly email)
│   ├── Custom report builder (filter by region, district, SKU, date range)
│   ├── Export to PDF, Excel, CSV
│   ├── Donor-ready report templates (UN OCHA, World Bank, USAID, EU)
│   └── Executive KPI dashboard
│
├── Module 10: Advanced Analytics & Predictive Intelligence
│   ├── Demand forecasting by region/season/disaster type
│   ├── Stock redistribution recommendations
│   ├── Expiry risk analysis and alerts
│   ├── Consumption trend analysis
│   ├── Seasonal risk correlation (rainy season, dry season, Harmattan fires)
│   └── What-if scenario modelling
│
├── Module 11: Warehouse & Location Management
│   ├── Warehouse capacity and utilisation tracking
│   ├── Warehouse status flags (Operational / Limited / Closed)
│   ├── Storage zone/bin management
│   ├── Warehouse condition assessments
│   └── Regional hierarchy mapping with boundary visualisation
│
├── Module 12: User & Organisation Management
│   ├── User directory (create, edit, deactivate accounts)
│   ├── Role assignment and permission matrix
│   ├── Warehouse-to-user mapping
│   ├── Bulk user import (CSV/Excel)
│   ├── Delegation rules (leave/backup approvers)
│   └── Training mode / sandbox environment
│
├── Module 13: Offline-First Mobile Operations
│   ├── Native Android app with offline sync
│   ├── Background data synchronisation
│   ├── Conflict resolution for concurrent edits
│   ├── Hardware barcode/QR scanner support
│   └── GPS tracking and geofencing
│
└── Module 14: Quality & Compliance
    ├── Cold-chain monitoring dashboard (Phase 2 IoT)
    ├── Donor-specific reporting requirements
    ├── Beneficiary distribution tracking
    ├── Compliance checklists and certifications
    └── Integration with Ghana Health Service for medical stock
```

### 10.3 FUTURE ROADMAP (Year 2+)

```
├── Native iOS app and enhanced offline capabilities
├── Full IoT integration (temperature, humidity, door sensors)
├── Advanced GPS vehicle tracking and route optimisation
├── Disaster incident linking (shipments tied to active incidents)
├── Open API for Ghana Government ERP integration (GIFMIS)
├── Beneficiary registration and aid distribution verification
├── Integration with NEMA, Ghana Meteorological Agency, Ghana Hydrological Authority
├── Satellite imagery / flood monitoring integration
├── Multi-language support (Twi, Ga, Ewe, Hausa, Dagbani)
└── Blockchain-anchored audit trail (optional for donor transparency)
```

---

## 11. Key Page Layouts

### 11.1 National Command Dashboard (HQ)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ [NADMO Logo]  NADMO WAREHOUSE COMMAND CENTRE    [🌍 EN] [🔔 3] [👤 DG ▼]  [⚙️]  [🚪]        │
├──────────────┬──────────────────────────────────────────────────────────────────────────────┤
│              │  NATIONAL OPERATIONS OVERVIEW                              [Today ▼] [Export]│
│  DASHBOARD   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  INVENTORY   │  │ 261      │ │ 14       │ │ 23       │ │ 8        │ │ 98.2%    │            │
│  TRANSFERS   │  │Warehouses│ │In-Transit│ │ Critical │ │ Active   │ │ Stock    │            │
│  ALERTS      │  │  Active  │ │Shipments │ │  Stock   │ │Transfers │ │ Accuracy │            │
│  REPORTS     │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│  ANALYTICS   │                                                                              │
│  WAREHOUSES  │  ┌─────────────────────────────┬─────────────────────────────────────────┐   │
│  USERS       │  │                             │  🚨 CRITICAL ALERTS                     │   │
│  SETTINGS    │  │   GHANA NATIONAL MAP        │  Brong-Ahafo: Tents < 5%                │   │
│              │  │   (interactive              │  Volta: Food Packs 0                    │   │
│  [+ NEW      │  │    choropleth map —         │  Oti: Medical Kits 10%                  │   │
│   TRANSFER]  │  │    green/amber/red by       │  [View All Alerts →]                    │   │
│              │  │    stock health)            ├─────────────────────────────────────────┤   │
│              │  │                             │  📊 PREDICTIVE INSIGHTS                 │   │
│              │  │  [Zoom] [Layer: Region]     │  ↑ 23% flood risk in Northern Region    │   │
│              │  │                             │  Recommend pre-positioning:             │   │
│              │  │                             │  • Water tablets: +5,000 units          │   │
│              │  │                             │  • Tarpaulins: +1,200 units             │   │
│              │  └─────────────────────────────┴─────────────────────────────────────────┘   │
│              │  ┌─────────────────────────────┬─────────────────────────────────────────┐   │
│              │  │  📈 STOCK TRENDS (30 DAYS)  │  🚚 RECENT ACTIVITY                     │   │
│              │  │  [Line chart]               │  10:42 Accra → Sunyani (In Transit)     │   │
│              │  │                             │  10:31 Receipt confirmed: Tamale        │   │
│              │  │                             │  09:55 Low stock alert: Kumasi          │   │
│              │  │                             │  09:12 Waybill generated: Wa            │   │
│              │  │                             │  [View Full Log →]                      │   │
│              │  └─────────────────────────────┴─────────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 District Warehouse View

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [NADMO Logo]  DISTRICT WAREHOUSE: ACCRA METRO    [🔄 Sync] [🔔] [👤 ▼]      │
├──────────────┬─────────────────────────────────────────────────────────────┤
│              │  STOCK ON HAND TODAY                                         │
│  RECEIVE     │  ┌─────────────────────────────────────────────────────┐    │
│  DISPATCH    │  │ Search items...    [Category ▼] [Scan QR ▣]         │    │
│  TRANSFERS   │  ├──────────────┬──────────┬──────────┬───────────────────┤    │
│  ALERTS      │  │ Item         │ Category │ Quantity │ Expiry / Status   │    │
│  REPORTS     │  ├──────────────┼──────────┼──────────┼───────────────────┤    │
│              │  │ Food Packs   │ Food     │ 1,240    │ ✅ OK             │    │
│  [+ QUICK    │  │ Tents        │ Shelter  │ 42       │ 🔴 CRITICAL       │    │
│   ACTION]    │  │ Medical Kits │ Medical  │ 89       │ 🟡 LOW            │    │
│              │  │ Water Tabs   │ WASH     │ 5,600    │ ✅ OK             │    │
│              │  │ Blankets     │ Shelter  │ 310      │ ✅ OK             │    │
│              │  └──────────────┴──────────┴──────────┴───────────────────┘    │
│              │                                                              │
│              │  ┌────────────────────────┬────────────────────────────────┐  │
│              │  │  INCOMING TRANSFERS    │  OUTGOING TRANSFERS            │  │
│              │  │  TRF-2026-0041 (2)     │  TRF-2026-0038 (In Transit)    │  │
│              │  │  [Confirm Receipt]     │  [Track Vehicle]               │  │
│              │  └────────────────────────┴────────────────────────────────┘  │
└──────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 12. Detailed Module Specifications

### 12.1 Module 1: Authentication, Identity & Access Management

#### 12.1.1 Authentication Flow

1. User navigates to `https://wms.nadmo.gov.gh`.
2. Enters username and password.
3. System validates credentials against Supabase Auth.
4. If MFA is enabled (required for HQ/Regional/Director roles), prompt for TOTP code from authenticator app.
5. On success, system issues JWT access token (short-lived, 15 minutes) and refresh token (secure, httpOnly cookie).
6. User redirected to role-appropriate dashboard.
7. All login events logged with IP address, user agent, timestamp, and MFA status.

#### 12.1.2 Multi-Factor Authentication (MFA)

| Role | MFA Required | Method |
|------|--------------|--------|
| Director-General / Deputy | Yes | TOTP (Google Authenticator, Microsoft Authenticator, Authy) |
| HQ Logistics / Procurement | Yes | TOTP |
| Regional Managers | Yes | TOTP |
| District Officers | Recommended | TOTP or SMS OTP |
| Auditors | Yes | TOTP |
| System Administrators | Yes | TOTP + hardware key optional |

#### 12.1.3 Role-Based Access Control (RBAC)

| Role | Code | Description |
|------|------|-------------|
| System Administrator | `sysadmin` | Full platform administration, user management, security settings |
| Director-General | `dg` | National oversight, executive reports, major transfer approval |
| HQ Logistics Officer | `hq_logistics` | National transfers, procurement coordination, threshold config |
| HQ Procurement Officer | `hq_procurement` | Supplier intake, donor receipt, stock valuation |
| Regional Manager | `regional_manager` | Regional oversight, medium transfer approval, district supervision |
| District Warehouse Officer | `district_officer` | District stock intake/dispatch, receipt confirmation |
| Field Response Officer | `field_officer` | Field dispatch, mobile updates, photo capture |
| Auditor | `auditor` | Read-only access to all data, audit log exports |
| Read-Only Observer | `readonly` | View-only access scoped to assigned warehouses |

#### 12.1.4 Session Security

| Control | Implementation |
|---------|----------------|
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 7 days (with rotation) |
| Inactivity timeout | 30 minutes (configurable per role) |
| Concurrent sessions | Maximum 2 active sessions per user; new login invalidates oldest |
| Password policy | Min 12 characters; uppercase, lowercase, number, special character; 90-day expiry; no reuse of last 6 passwords |
| Account lockout | 5 failed attempts → 15-minute lockout; alert security admin |
| Password reset | Email/SMS OTP with 1-hour expiry; admin-initiated reset logged |

---

### 12.2 Module 4: Warehouse Inventory Management

#### 12.2.1 Stock Intake Workflow

1. User selects **Receive Stock**.
2. System prompts for source: **HQ Transfer / External Supplier / Donor / Other Warehouse / Return from Field**.
3. User scans QR/barcode on incoming items or selects SKU manually.
4. User enters quantity, batch/lot number, manufacturing date, expiry date (if applicable), storage location.
5. System validates against expected inbound transfer (if linked) or creates new intake record.
6. User uploads photo evidence (optional but recommended for donors/large receipts).
7. User confirms; stock updated in real time; audit log entry created.
8. If linked to transfer order, transfer status updated to **Received**.

#### 12.2.2 Stock Dispatch Workflow

1. User selects **Dispatch Stock**.
2. System prompts for destination: **Another Warehouse / Field Site / Disposal / Donor Return**.
3. User scans items or selects SKU; system checks available stock (respecting FEFO for expiry-managed items).
4. User enters quantity and reason.
5. System validates sufficient stock; warns if dispatch would breach minimum threshold.
6. For transfers to another warehouse, a transfer order is auto-created or linked.
7. Stock is **allocated** (reserved) at dispatch and **deducted** on waybill confirmation.
8. Audit log entry created.

#### 12.2.3 Stock Adjustment Workflow

| Adjustment Type | Approval Required | Reason Mandatory | Examples |
|-----------------|-------------------|------------------|----------|
| Damage | District Officer + Regional Manager | Yes | Broken water containers, torn tents |
| Expiry | District Officer | Yes | Expired medical kits, food packs |
| Correction | District Officer + Regional Manager | Yes | Data entry error, cycle count variance |
| Write-off | Regional Manager + HQ Logistics | Yes | Obsolete equipment, disposal |
| Loss / Theft | Regional Manager + HQ Logistics + Auditor | Yes | Missing items, investigation required |

All adjustments require photo evidence for quantities > 20 units or value > GHS 1,000.

#### 12.2.4 Batch, Lot & Expiry Tracking (FEFO)

- Every stockable item can optionally have a batch/lot number and expiry date.
- System enforces **First-Expiry-First-Out (FEFO)** for dispatches.
- Expiry alerts generated 90, 60, 30, and 7 days before expiry.
- Expired items are automatically quarantined from dispatch and flagged for disposal.

---

### 12.3 Module 5: Transfer Order & Waybill Management

#### 12.3.1 Transfer Order Lifecycle

| Status | Trigger | UI Indicator | Who Can Act |
|--------|---------|--------------|-------------|
| Draft | Created but not submitted | Grey | Creator only |
| Pending Approval | Submitted, awaiting sign-off | Amber pulsing | Assigned approver |
| Approved | Approved by authorised officer | Blue | Logistics / source warehouse |
| Ready for Dispatch | Vehicle and driver assigned | Blue | Source warehouse |
| In Transit | Vehicle departed | Blue + animated route | Read-only; driver/field officer updates |
| Received | Destination confirmed receipt | Green | Destination officer |
| Discrepancy | Quantity/quality mismatch on receipt | Red | Regional Manager + HQ Logistics |
| Cancelled | Cancelled before delivery | Grey strikethrough | HQ Admin or creator (if not yet dispatched) |
| Overdue | In-transit > configured SLA | Red flashing | Auto-escalated |

#### 12.3.2 Hierarchical Approval Matrix

| Transfer Scale | Quantity | Est. Value | Approver | SLA |
|----------------|----------|------------|----------|-----|
| Routine | < 100 units | < GHS 5,000 | District Officer (self-authorising) | Immediate |
| Standard | 100–499 units | GHS 5,000–49,999 | Regional Manager | 4 hours |
| Large | 500–1,999 units | GHS 50,000–199,999 | HQ Logistics Officer | 8 hours |
| Strategic | ≥ 2,000 units | ≥ GHS 200,000 | Director-General or Deputy | 24 hours |

> The approval matrix is configurable by HQ Admin. All changes logged in audit trail.

#### 12.3.3 Escalation Rules (SLA Breach)

| Approver | SLA | Missed By | Escalates To |
|----------|-----|-----------|--------------|
| Regional Manager | 4 hours | 1 hour | HQ Logistics Officer |
| HQ Logistics Officer | 8 hours | 2 hours | Director-General |
| Director-General | 24 hours | 4 hours | Manual intervention flagged; no auto-approve |

#### 12.3.4 Digital Waybill Specification

Each approved transfer generates a digital waybill containing:

- Unique waybill number (e.g., `WB-ACC-SUN-2026-0041`)
- Transfer order reference
- Source and destination warehouse details
- Itemised list with SKU codes, descriptions, quantities, batch/lot numbers
- QR code encoding transfer ID + verification hash
- Vehicle registration, driver name, driver phone
- Expected delivery date and SLA
- Digital signature blocks for dispatcher and receiver
- PDF export (A4, print-ready)

#### 12.3.5 Receipt Confirmation

1. Receiving officer scans waybill QR code or enters waybill number.
2. System displays dispatched quantities.
3. Officer counts physical items and enters received quantities.
4. If discrepancy detected, system prompts for photos and reason.
5. Officer captures digital signature (touch/stylus/mouse).
6. System updates stock, transfer status, and audit log.
7. Notifications sent to source warehouse, regional manager, and HQ logistics.

---

### 12.4 Module 6: Alerts & Notifications

#### 12.4.1 Alert Categories

| Category | Trigger | Default Recipients | Channels |
|----------|---------|-------------------|----------|
| Critical Stock | Stock ≤ minimum threshold | District Officer, Regional Manager, HQ Logistics | In-app + SMS + Email |
| Amber Stock | Stock ≤ 150% of minimum | District Officer, Regional Manager | In-app + SMS |
| Overdue Shipment | In-transit > SLA | Regional Manager, HQ Logistics, Source Officer | In-app + SMS + Email |
| Discrepancy | Quantity mismatch on receipt | Regional Manager, HQ Logistics, Auditor | In-app + SMS + Email |
| Approval SLA Breach | Approval pending > SLA | Next approver, HQ Admin | In-app + SMS + Email |
| Expiry Warning | Item expiring within 30/60/90 days | District Officer, Regional Manager | In-app + Email |
| System Security | Failed login, password reset, role change | System Admin, User | Email |

#### 12.4.2 Threshold Architecture

Thresholds operate at three levels, with the most specific level taking precedence:

| Level | Who Sets It | Scope |
|-------|-------------|-------|
| System Default | Platform administrator | Applied to all warehouses for a given SKU category |
| Regional Override | Regional Manager | Overrides default for all districts in their region |
| District Override | District Officer (with Regional approval) | Overrides for a specific warehouse |

#### 12.4.3 Pre-loaded Recommended Defaults

Tier multipliers: District = 1×, Regional = 5×, HQ/Greater Accra = 20×

| Category | Minimum (District) | Minimum (Regional) | Minimum (HQ) | Alert Logic |
|----------|-------------------|-------------------|--------------|-------------|
| Food Packs | 200 units | 1,000 units | 4,000 units | Red < min; Amber < 150% min |
| Shelter (Tents, Tarpaulins) | 50 units | 250 units | 1,000 units | Red < min; Amber < 150% min |
| Medical Kits | 30 units | 150 units | 600 units | Red < min; Amber < 150% min |
| Rescue Equipment | 10 units | 50 units | 200 units | Red < min; Amber < 150% min |
| PPE | 20 units | 100 units | 400 units | Red < min; Amber < 150% min |
| Water & Sanitation | 100 units | 500 units | 2,000 units | Red < min; Amber < 150% min |

> Thresholds stored in `warehouse_thresholds` table: `warehouse_id`, `sku_category_id`, `min_quantity`, `amber_multiplier` (default 1.5), `set_by_user_id`, `set_at`. Most specific non-null row wins.

---

### 12.5 Module 7: Audit Trail & Supervision

#### 12.5.1 Audit Log Requirements

Every audit log entry must capture:

- `event_id` — UUID
- `timestamp` — ISO 8601 UTC
- `user_id` — actor
- `user_role` — role at time of action
- `warehouse_id` — affected warehouse (if applicable)
- `region_id` — affected region (if applicable)
- `action` — CREATE / UPDATE / DELETE / LOGIN / LOGOUT / EXPORT / APPROVE / REJECT
- `entity_type` — transfer / stock / user / threshold / report / waybill
- `entity_id` — affected record ID
- `old_value` — JSON snapshot (for updates/deletes)
- `new_value` — JSON snapshot
- `ip_address` — client IP
- `user_agent` — browser/device
- `session_id` — session correlation
- `hash` — cryptographic hash chaining for tamper evidence

#### 12.5.2 Tamper Evidence

- Audit log table is append-only at the database level (no UPDATE or DELETE).
- Each log entry includes a hash of the previous entry’s hash + current payload.
- Daily hash snapshot exported to a separate write-once storage location.
- Any tampering attempt invalidates the hash chain and triggers a security alert.

#### 12.5.3 Supervisory Drill-Down

HQ and authorised regional users can drill down:

```
National Overview
    └── Region (e.g., Ashanti)
            └── District (e.g., Kumasi Metro)
                    └── Warehouse
                            └── Stock by SKU
                            └── Transfer History
                            └── Users
                            └── Audit Log
```

---

### 12.6 Module 10: Predictive Analytics & Intelligence

#### 12.6.1 Demand Forecasting

The analytics engine will use:

- Historical consumption by region/district/SKU
- Seasonal disaster risk data (rainy season, dry season, Harmattan)
- Population density and vulnerability indices
- Current stock levels and expiry profiles
- Active and forecasted weather alerts from Ghana Meteorological Agency

Outputs:

- 30/60/90-day stock level projections
- Recommended pre-positioning quantities by region
- Risk-ranked warehouse list
- Automated procurement trigger suggestions

#### 12.6.2 Stock Redistribution Optimiser

When a region faces a shortfall, the system recommends optimal source warehouses considering:

- Available surplus stock
- Distance / road conditions
- Vehicle availability
- expiry dates (FEFO)
- Historical transfer success rates

#### 12.6.3 Expiry Risk Analysis

- Dashboard showing items expiring within 30/60/90 days.
- Recommendation to redistribute near-expiry stock to high-consumption districts.
- Alerts to warehouse officers to prioritise FEFO dispatch.

---

## 13. Data Model

### 13.1 Entity Relationship Overview

```
regions ||--o{ districts : contains
districts ||--o{ warehouses : contains
warehouses ||--o{ inventory : holds
warehouses ||--o{ warehouse_thresholds : configures
users ||--o{ user_warehouses : assigned_to
users ||--o{ transfers : creates
users ||--o{ transfers : approves
users ||--o{ transfers : receives
users ||--o{ audit_logs : generates
roles ||--o{ users : assigns
sku_categories ||--o{ skus : categorises
skus ||--o{ inventory : instances
skus ||--o{ transfer_items : moved_in
transfers ||--o{ transfer_items : contains
transfers ||--o{ waybills : generates
transfers ||--o{ gps_tracking : tracks
transfers ||--o{ discrepancies : raises
notifications ||--o{ users : sent_to
```

### 13.2 Core Tables

#### `regions`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Unique region ID |
| `code` | VARCHAR(10) | ISO/Ghana region code (e.g., `GR`, `AH`, `NR`) |
| `name` | VARCHAR(100) | Region name (e.g., Greater Accra, Ashanti) |
| `capital` | VARCHAR(100) | Regional capital |
| `geo_boundary` | GEOJSON | Regional boundary polygon |
| `risk_profile` | JSONB | Seasonal risk scores by disaster type |
| `created_at` | TIMESTAMP | Record creation |

#### `districts`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Unique district ID |
| `region_id` | UUID FK | Parent region |
| `name` | VARCHAR(100) | District name |
| `capital` | VARCHAR(100) | District capital |
| `geo_boundary` | GEOJSON | District boundary polygon |
| `population` | INTEGER | Estimated population |
| `vulnerability_index` | DECIMAL | Composite vulnerability score |

#### `warehouses`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Unique warehouse ID |
| `district_id` | UUID FK | Parent district |
| `code` | VARCHAR(20) | Unique warehouse code (e.g., `WH-GR-ACC`) |
| `name` | VARCHAR(150) | Warehouse name |
| `type` | ENUM | `hq` / `regional` / `district` |
| `address` | TEXT | Physical address |
| `latitude` | DECIMAL | GPS latitude |
| `longitude` | DECIMAL | GPS longitude |
| `manager_id` | UUID FK | Assigned manager |
| `capacity_m3` | DECIMAL | Storage capacity in cubic metres |
| `status` | ENUM | `operational` / `limited` / `closed` |
| `phone` | VARCHAR(20) | Contact phone |
| `email` | VARCHAR(100) | Contact email |

#### `sku_categories`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Unique category ID |
| `name` | VARCHAR(50) | Category name |
| `code` | VARCHAR(20) | Category code |
| `description` | TEXT | Description |
| `default_unit` | VARCHAR(20) | Default unit of measure |

#### `skus`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Unique SKU ID |
| `sku_code` | VARCHAR(50) UK | Unique SKU code |
| `name` | VARCHAR(150) | Item name |
| `category_id` | UUID FK | Category |
| `description` | TEXT | Description |
| `unit_of_measure` | VARCHAR(20) | Unit (e.g., units, boxes, pallets) |
| `weight_kg` | DECIMAL | Weight per unit |
| `volume_m3` | DECIMAL | Volume per unit |
| `shelf_life_days` | INTEGER | Shelf life in days (optional) |
| `hazard_class` | VARCHAR(50) | Hazard classification (optional) |
| `image_url` | VARCHAR(255) | Item photo URL |
| `is_active` | BOOLEAN | Active status |

#### `inventory`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Inventory line ID |
| `warehouse_id` | UUID FK | Warehouse |
| `sku_id` | UUID FK | SKU |
| `batch_lot` | VARCHAR(50) | Batch or lot number |
| `expiry_date` | DATE | Expiry date (optional) |
| `quantity` | INTEGER | Current quantity |
| `reserved_quantity` | INTEGER | Quantity reserved for pending transfers |
| `available_quantity` | INTEGER | Computed: quantity - reserved |
| `storage_location` | VARCHAR(50) | Bin/zone location |
| `last_counted_at` | TIMESTAMP | Last physical count |
| `updated_at` | TIMESTAMP | Last update |

#### `warehouse_thresholds`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Threshold ID |
| `warehouse_id` | UUID FK | Warehouse (NULL for default) |
| `region_id` | UUID FK | Region (NULL unless regional override) |
| `sku_category_id` | UUID FK | Category |
| `min_quantity` | INTEGER | Minimum threshold |
| `amber_multiplier` | DECIMAL | Default 1.5 |
| `set_by_user_id` | UUID FK | User who set it |
| `set_at` | TIMESTAMP | When set |

#### `transfers`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Transfer ID |
| `transfer_number` | VARCHAR(30) UK | Human-readable number (e.g., `TRF-2026-0041`) |
| `source_warehouse_id` | UUID FK | Source warehouse |
| `destination_warehouse_id` | UUID FK | Destination warehouse |
| `created_by` | UUID FK | Creator |
| `created_at` | TIMESTAMP | Creation time |
| `status` | ENUM | Transfer status |
| `priority` | ENUM | `routine` / `urgent` / `emergency` |
| `approved_by` | UUID FK | Approver |
| `approved_at` | TIMESTAMP | Approval time |
| `vehicle_registration` | VARCHAR(20) | Vehicle plate |
| `driver_name` | VARCHAR(100) | Driver name |
| `driver_phone` | VARCHAR(20) | Driver phone |
| `dispatcher_id` | UUID FK | Dispatcher |
| `dispatched_at` | TIMESTAMP | Dispatch time |
| `received_by` | UUID FK | Receiver |
| `received_at` | TIMESTAMP | Receipt time |
| `expected_delivery_at` | TIMESTAMP | Expected delivery |
| `actual_delivery_at` | TIMESTAMP | Actual delivery |
| `digital_signature` | TEXT | Base64 signature image |
| `notes` | TEXT | Notes |

#### `transfer_items`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Transfer item ID |
| `transfer_id` | UUID FK | Parent transfer |
| `sku_id` | UUID FK | SKU |
| `batch_lot` | VARCHAR(50) | Batch/lot |
| `quantity_dispatched` | INTEGER | Dispatched quantity |
| `quantity_received` | INTEGER | Received quantity |
| `condition` | ENUM | `good` / `damaged` / `expired` / `missing` |

#### `audit_logs`

(See Module 7 for full field specification.)

### 13.3 Row-Level Security (RLS) Policies

| Policy | Rule |
|--------|------|
| District officers | SELECT/INSERT/UPDATE only where `warehouse_id` = assigned warehouse |
| Regional managers | Access where `region_id` = assigned region |
| HQ logistics | Full SELECT; INSERT/UPDATE on transfers, thresholds, warehouses |
| Director-General | Full SELECT; INSERT/UPDATE on approvals and executive actions |
| Auditor | Full SELECT only; no modifications |
| System admin | Full access for platform management |
| Audit log | INSERT only — no UPDATE or DELETE permitted by any role |

---

## 14. API Design

### 14.1 API Architecture

- **Primary API**: Supabase PostgREST (auto-generated RESTful API from PostgreSQL schema)
- **Custom API**: Supabase Edge Functions for complex business logic (SMS, PDF generation, ML predictions, GPS)
- **Real-time**: Supabase Realtime for live dashboard updates
- **Authentication**: JWT tokens via Supabase Auth
- **Rate Limiting**: 100 requests/minute per user; 10 SMS/hour per user

### 14.2 Key Custom Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/functions/v1/transfer/create` | POST | Create transfer order with validation | Authenticated |
| `/functions/v1/transfer/approve` | POST | Approve/reject transfer | Authenticated + authorised |
| `/functions/v1/transfer/receive` | POST | Confirm receipt with signature | Authenticated + authorised |
| `/functions/v1/transfer/waybill` | GET | Generate PDF waybill | Authenticated |
| `/functions/v1/stock/intake` | POST | Receive stock with audit | Authenticated |
| `/functions/v1/stock/dispatch` | POST | Dispatch stock | Authenticated |
| `/functions/v1/stock/adjust` | POST | Stock adjustment with approval | Authenticated + authorised |
| `/functions/v1/alerts/check` | POST | Trigger threshold alert evaluation | Service role |
| `/functions/v1/sms/send` | POST | Send SMS via Arkesel | Service role |
| `/functions/v1/reports/generate` | POST | Generate PDF/Excel report | Authenticated + authorised |
| `/functions/v1/analytics/forecast` | GET | Demand forecast | Authenticated + HQ/Regional |
| `/functions/v1/gps/track` | POST | Update vehicle GPS position | Authenticated + driver/field role |
| `/functions/v1/import/bulk` | POST | Bulk import users/SKUs/warehouses | Authenticated + admin |

### 14.3 Real-Time Subscriptions

| Channel | Event | Subscribers |
|---------|-------|-------------|
| `public:transfers` | INSERT/UPDATE/DELETE | Dashboard users, regional managers |
| `public:inventory` | UPDATE | Warehouse officers, dashboard |
| `public:alerts` | INSERT | Notification service, dashboard alert panel |
| `public:gps_tracking` | INSERT | Map viewers, logistics officers |

---

## 15. Security Architecture

### 15.1 Defence-in-Depth Model

```
┌─────────────────────────────────────────┐
│  Layer 1: Perimeter Security            │
│  TLS 1.3, WAF, DDoS protection, CDN     │
├─────────────────────────────────────────┤
│  Layer 2: Application Security          │
│  AuthN/AuthZ, MFA, RBAC, input validation│
├─────────────────────────────────────────┤
│  Layer 3: Data Security                 │
│  Encryption at rest (AES-256), RLS,     │
│  field-level encryption for PII/sigs    │
├─────────────────────────────────────────┤
│  Layer 4: Network Security              │
│  VPC, private DB, IP allowlisting       │
├─────────────────────────────────────────┤
│  Layer 5: Audit & Monitoring            │
│  Immutable logs, SIEM, anomaly alerts   │
├─────────────────────────────────────────┤
│  Layer 6: Operational Security          │
│  Secrets management, least privilege,   │
│  regular penetration testing            │
└─────────────────────────────────────────┘
```

### 15.2 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Username/password + TOTP MFA for privileged roles |
| Transport security | TLS 1.3 minimum; HSTS enabled; secure cookies |
| Data at rest | AES-256 encryption for database and object storage |
| Data in transit | TLS 1.3 for all API and database connections |
| Secrets management | HashiCorp Vault / AWS Secrets Manager / equivalent |
| Role-based access | Least privilege; enforced at application and database level |
| Row-level security | Supabase RLS policies prevent cross-tenant data leakage |
| Audit logging | Immutable, append-only, hash-chained audit log |
| Session security | Short-lived JWTs, refresh token rotation, inactivity timeout |
| Password policy | Min 12 chars, complexity, expiry, history restriction |
| API security | Rate limiting, input validation, CORS, CSRF protection |
| File uploads | Virus scanning, type validation, size limits, access controls |
| Backup security | Encrypted backups, off-site retention, access logging |
| Penetration testing | Annual third-party penetration test and vulnerability assessment |

### 15.3 Data Classification

| Classification | Examples | Handling |
|----------------|----------|----------|
| **Public** | Warehouse names, regional boundaries | No restriction |
| **Internal** | Stock levels, transfer schedules | Authenticated access |
| **Confidential** | User PII, driver details, donor information | Encrypted at rest, role-restricted |
| **Restricted** | Audit logs, security events, cryptographic keys | Admin-only, write-once storage |

### 15.4 Incident Response

| Severity | Examples | Response Time |
|----------|----------|---------------|
| Critical | Data breach, unauthorised admin access, system-wide outage | 1 hour |
| High | Suspected account compromise, mass failed logins | 4 hours |
| Medium | Policy violation, non-critical vulnerability | 24 hours |
| Low | Minor access request, documentation update | 72 hours |

---

## 16. Compliance & Governance

### 16.1 Regulatory Compliance

| Regulation / Standard | Requirement | NADMO-WMS Compliance |
|-----------------------|-------------|----------------------|
| **Ghana Data Protection Act, 2012 (Act 843)** | Lawful processing, data minimisation, security, individual rights | Privacy-by-design; data minimisation; encryption; access controls; audit trail |
| **NITA ICT Standards** | Government IT standards, interoperability, security | Standards-based APIs; security architecture review; NITA certification path |
| **Public Financial Management Regulations** | Accountability, audit trail, asset tracking | Immutable transaction logs, valuation reports, reconciliation tools |
| **GIFMIS Integration (Future)** | Financial reporting alignment | Standard chart of accounts mapping; export formats |
| **UN OCHA Humanitarian Data Principles** | Transparency, privacy, ethics | Donor reporting, anonymised analytics, ethical use guidelines |

### 16.2 Data Residency & Sovereignty

- Phase 1: Data hosted in Supabase Cloud (region selectable; preference for EU or African region with migration path).
- Phase 2: Containerised deployment option for GovTech Ghana or accredited local cloud.
- Phase 3: Full sovereign hosting in Ghana with NITA accreditation.
- All data remains property of the Government of Ghana at all times.
- Full data export available on demand in open formats (CSV, JSON, PDF).

### 16.3 Accessibility

- WCAG 2.1 AA compliance target.
- Keyboard-navigable interface.
- Screen reader compatible components.
- Colour contrast ratios meet accessibility standards.
- Mobile-responsive design for low-resolution screens.

### 16.4 Ethical Use & Bias

- Predictive analytics recommendations are advisory; human approval required for all dispatches.
- Algorithmic decisions are explainable and auditable.
- No automated decision-making affecting beneficiary rights.
- Regular review of model fairness across regions and disaster types.

---

## 17. Design System & User Experience

### 17.1 Design Principles

| Principle | Application |
|-----------|-------------|
| **Clarity under pressure** | Large KPIs, clear status colours, minimal cognitive load for crisis use |
| **Mobile-first field operations** | Touch-friendly buttons, offline awareness, simple workflows |
| **Trust through transparency** | Every action logged, every status visible, every alert traceable |
| **Ghana-centric** | Local terminology, Ghana map, regional context, multi-language ready |
| **Professional government grade** | Clean, authoritative, no unnecessary decoration |

### 17.2 Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--nadmo-red` | `#C41E3A` | Critical alerts, emergencies, destructive actions |
| `--nadmo-amber` | `#F59E0B` | Warnings, pending approvals, amber stock |
| `--nadmo-green` | `#10B981` | OK status, received, success |
| `--nadmo-blue` | `#0066CC` | Primary brand, in-transit, links |
| `--nadmo-navy` | `#0F172A` | Headers, text, sidebar |
| `--nadmo-grey-100` | `#F1F5F9` | Backgrounds |
| `--nadmo-grey-500` | `#64748B` | Secondary text |
| `--nadmo-white` | `#FFFFFF` | Cards, surfaces |

### 17.3 Typography

- **Headings**: Inter or system sans-serif (clean, highly legible)
- **Body**: Inter / Roboto
- **Monospace**: JetBrains Mono for data tables and audit logs
- **Base size**: 16px; minimum touch target 44×44px

### 17.4 Iconography

- Use Lucide icons or equivalent for consistency.
- Status icons:
  - ✅ Green check for OK/Received
  - 🟡 Amber triangle for Warning
  - 🔴 Red circle for Critical
  - 🔵 Blue truck for In-Transit
  - ⚪ Grey clock for Pending

### 17.5 Component Library

- Built on **shadcn/ui** + **Radix UI** primitives.
- Custom components: status badges, alert cards, transfer timeline, signature pad, map choropleth, KPI tiles, data tables with pagination.

### 17.6 User Experience Tenets

1. **Three-click rule**: Core actions (receive, dispatch, transfer) achievable within three clicks from the dashboard.
2. **Progressive disclosure**: Advanced options hidden until needed.
3. **Optimistic feedback**: Actions show immediate UI feedback; background sync for slower operations.
4. **Error forgiveness**: Clear error messages, undo where safe, autosave on forms.
5. **Contextual help**: Tooltips, inline guidance, and a searchable help centre.

---

## 18. Connectivity Resilience — Low-Bandwidth Design

Ghana’s connectivity varies significantly between urban HQ offices and rural district warehouses. NADMO-WMS is designed to function on **1–2 Mbps connections as a baseline**, with full offline capabilities in Phase 2.

| Principle | Implementation |
|-----------|----------------|
| Lazy loading | Heavy assets (maps, large tables) load after critical UI |
| Pagination | All lists paginated (default 25 rows/page; max 100) |
| Optimistic UI | Form submissions show immediate feedback; sync in background |
| Compressed assets | WebP images; JS/CSS minified + Brotli/gzip via CDN |
| Progressive data loading | Dashboard KPI tiles load independently; skeleton screens |
| Request caching | Read-heavy data cached locally for 5 minutes via service worker |
| No heavy media | Zero autoplay media; SVG charts preferred over canvas |
| Connection status | Banner when offline: “You are offline. Changes will sync when reconnected.” |
| Background sync | PWA service worker queues mutations and syncs on reconnection |
| Data sync conflict resolution | Last-write-wins with manual merge for critical conflicts |

---

## 19. Ghana National Map & GIS

### 19.1 Map Requirements

| Item | Detail |
|------|--------|
| Map library | Mapbox GL JS (recommended) or Leaflet.js |
| Base tiles | OpenStreetMap / Mapbox Streets |
| Boundary data | OSM administrative boundaries — admin level 4 (regions), admin level 6 (districts) via Geofabrik Ghana extract |
| Choropleth colours | Green (all OK) / Amber (warning) / Red (critical) / Grey (no data) |
| Interactions | Click district → detail panel slides in; hover → tooltip (district name + critical item count) |
| Data refresh | Map colours refresh every 5 minutes or on real-time event |
| Low-connectivity fallback | If tiles fail, degrade to tabular district list sorted by criticality |
| Vehicle tracking | Live GPS positions overlaid on map for in-transit shipments |
| Attribution | “© OpenStreetMap contributors” required (ODbL licence) |

### 19.2 GhanaPost GPS Integration

- Use GhanaPost GPS addresses for warehouse location capture and waybill delivery coordinates.
- Fallback to manual latitude/longitude entry for locations not yet covered.

---

## 20. Copy & Language Standards

**Overall Tone: Professional, Authoritative, Calm under Pressure** — Government emergency management platform. Clear, direct, institutional language throughout.

| Context | Copy |
|---------|------|
| Page title — Dashboard | “National Operations Overview” |
| Page title — Transfers | “Transfer Orders” |
| Empty state — No transfers | “No transfer orders yet. Create your first transfer to begin tracking logistics movement.” |
| Empty state CTA | “Create Transfer Order” |
| Success — Transfer created | “Transfer Order #[ID] created successfully. Waybill is ready to download.” |
| Error — Insufficient stock | “Insufficient stock at [Warehouse Name]. Available: [X] units. Requested: [Y] units.” |
| Error — Network failure | “Connection lost. Your progress has been saved. Please retry when your connection is restored.” |
| Loading state | “Loading operational data…” |
| Cancel transfer confirm | “Cancel this transfer? The destination warehouse will be notified. This cannot be undone.” |
| Cancel confirm button | “Yes, Cancel Transfer” |
| Cancel abort button | “Keep Transfer Active” |
| Discard changes prompt | “You have unsaved changes. Discard them?” |
| Low stock alert | “[Warehouse Name] — [Item Name] is below the minimum threshold ([X] units remaining).” |
| Overdue shipment alert | “Transfer #[ID] to [Warehouse] is overdue. Expected delivery: [Date]. Please investigate.” |
| Discrepancy raised | “Quantity discrepancy on Transfer #[ID]. Dispatched: [X]. Received: [Y]. Escalated to your Regional Manager.” |
| Receive confirmation CTA | “Confirm Receipt & Sign” |
| Export button | “Export Report” |
| No permission error | “You do not have permission to perform this action. Contact your administrator.” |
| Offline banner | “You are offline. Changes will sync automatically when your connection is restored.” |

### 20.1 Localisation Roadmap

- **Phase 1**: English (Ghana)
- **Phase 2**: Twi, Ga, Ewe, Hausa, Dagbani for field-facing mobile screens
- **Phase 3**: Full platform localisation

---

## 21. Non-Functional Requirements

### 21.1 Performance

| Metric | Requirement |
|--------|-------------|
| First Contentful Paint | < 2.0 seconds on 5 Mbps connection |
| Time to Interactive | < 4.0 seconds on desktop; < 6.0 seconds on mobile 3G |
| Dashboard data refresh | ≤ 5 minutes (configurable); manual refresh always available |
| Real-time event propagation | < 3 seconds from transaction to dashboard update |
| Transfer order submission | API response < 800 ms |
| Report generation (national) | < 10 seconds for 90-day range; < 30 seconds for annual |
| Concurrent users | 500+ simultaneous users without degradation |
| Peak load handling | 2× normal concurrent load during national emergencies |
| Uptime SLA | 99.9% excluding scheduled maintenance |
| Scheduled maintenance | Off-peak windows (02:00–05:00 GMT); 48-hour notice |

### 21.2 Scalability

| Dimension | Target |
|-----------|--------|
| Warehouses | 300+ (HQ + 16 regions + 261+ districts) |
| SKUs | 10,000+ active items |
| Users | 1,000+ active users |
| Transactions | 100,000+ per month |
| Audit log | 10 million+ records with query optimisation |
| Reports | National reports generated in < 10 seconds |

### 21.3 Reliability

| Requirement | Implementation |
|-------------|----------------|
| Database backups | Automated every 6 hours; daily full backup; 30-day rolling retention |
| Off-site backup | Encrypted copies to geographically separate storage |
| Disaster recovery | RPO ≤ 1 hour; RTO ≤ 4 hours |
| Health checks | Automated uptime and dependency monitoring |
| Circuit breakers | Graceful degradation when external services (SMS, GPS) fail |

### 21.4 Security (Detailed)

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Username + Password + TOTP MFA |
| Transport security | TLS 1.3; HTTPS enforced; HSTS |
| Data at rest | AES-256 encryption (database + backups + object storage) |
| Data in transit | TLS 1.3 for all connections |
| Role-based access | Least privilege; enforced at application and DB level |
| Audit logging | Immutable, append-only, hash-chained log |
| Session security | 30-minute inactivity timeout; single active session policy; token rotation |
| Password policy | Min 12 chars, complexity, 90-day expiry, no reuse of last 6 |
| Hosting | Vercel + Supabase (Phase 1); GovTech Ghana self-hosted (Phase 2) |
| Vulnerability management | Monthly dependency scans; annual penetration test |

### 21.5 Compatibility

| Dimension | Requirement |
|-----------|-------------|
| Desktop browsers | Chrome 100+, Edge 100+, Firefox 100+, Safari 15+ |
| Mobile browsers | Chrome on Android 9+, Safari on iOS 14+ |
| Minimum screen | 320px width (mobile-first responsive) |
| Tablets | Optimised for 7–10 inch Android tablets |
| Language | English (Phase 1); Twi, Ga, Ewe, Hausa, Dagbani (Phase 2) |

### 21.6 Data & Retention

| Item | Policy |
|------|--------|
| Transaction records | Retained indefinitely (government compliance) |
| Deleted records | Soft-delete only — never purged |
| Audit logs | Retained indefinitely; write-once storage |
| Backups | Daily automated; 30-day rolling retention; off-site copy |
| Data ownership | All data owned by NADMO / Government of Ghana |
| Export | Full data export available at any time (CSV/JSON/PDF) — no vendor lock-in |
| Data purge | No automatic purge; archive-only after 7 years |

---

## 22. Implementation Roadmap

### 22.1 Phase 1: Foundation & National Visibility (Months 1–6)

| Month | Deliverables |
|-------|--------------|
| 1 | Project kick-off, stakeholder alignment, detailed technical design, security architecture review |
| 2 | Core platform setup (Next.js + Supabase), authentication, RBAC, warehouse/SKU master data |
| 3 | Inventory management, transfer orders, waybill generation, digital signatures |
| 4 | National/regional/district dashboards, alerts, SMS integration (Arkesel), audit trail |
| 5 | Reporting module, bulk import, user management, connectivity resilience, UAT preparation |
| 6 | User acceptance testing, security audit, training rollout, pilot launch (Greater Accra + 3 regions) |

### 22.2 Phase 2: Scale & Intelligence (Months 7–12)

| Month | Deliverables |
|-------|--------------|
| 7 | National rollout to all 16 regions and 261 districts |
| 8 | Native Android app with offline sync; hardware barcode scanner support |
| 9 | GPS vehicle tracking integration; GhanaPost GPS |
| 10 | Predictive analytics and demand forecasting |
| 11 | Advanced reports, donor templates, cold-chain monitoring (pilot) |
| 12 | GovTech Ghana migration readiness assessment; sovereign hosting pilot |

### 22.3 Phase 3: Ecosystem Integration (Year 2+)

| Initiative | Description |
|------------|-------------|
| GIFMIS Integration | Financial data exchange and procurement alignment |
| NEMA / Met Agency Integration | Incident linking and weather-based risk alerts |
| Beneficiary Distribution | Track aid from warehouse to final beneficiary |
| IoT Cold Chain | Temperature/humidity sensors in strategic warehouses |
| Multi-Language | Full Twi, Ga, Ewe, Hausa, Dagbani support |
| Open API | Government-approved API for partner systems |

### 22.4 Go-Live Strategy

| Wave | Scope | Timeline |
|------|-------|----------|
| Pilot Wave 1 | Greater Accra HQ + 3 regional warehouses + 12 district warehouses | Month 6 |
| Wave 2 | All 16 regional warehouses + 50 district warehouses | Month 8 |
| Wave 3 | All 261 district warehouses | Month 10 |
| National Operations | Full operational use; decommission paper registers | Month 12 |

---

## 23. Success Metrics & Key Performance Indicators (KPIs)

### 23.1 Operational KPIs

| KPI | Baseline | Target (12 Months) | Measurement |
|-----|----------|--------------------|-------------|
| % warehouses digitised | 0% | 100% | Active warehouse accounts |
| Stock data accuracy | Unknown | ≥ 98% | Cycle count variance |
| Average dispatch-to-receipt time | Days | ≤ 24 hours (intra-region) | Transfer lifecycle data |
| % transfers with digital waybill | 0% | 100% | Transfer records |
| % receipts confirmed within SLA | 0% | ≥ 95% | Receipt timestamps |
| Critical stock response time | Hours/days | ≤ 2 hours | Alert-to-action time |

### 23.2 User Adoption KPIs

| KPI | Target |
|-----|--------|
| Active users (monthly) | ≥ 90% of registered users |
| Transactions captured digitally | ≥ 95% of all stock movements |
| Mobile/tablet usage | ≥ 70% of district/field users |
| Training completion | ≥ 95% of target users |
| User satisfaction (CSAT) | ≥ 4.0 / 5.0 |

### 23.3 Governance & Accountability KPIs

| KPI | Target |
|-----|--------|
| Audit trail coverage | 100% of create/update/delete actions |
| Discrepancy resolution time | ≤ 48 hours |
| Report generation time | ≤ 2 minutes for standard reports |
| Data export availability | 100% on demand |
| Security incidents | Zero critical breaches |

### 23.4 Impact KPIs

| KPI | Baseline | Target |
|-----|----------|--------|
| Response time to disaster-affected communities | Variable | 50% reduction |
| Stockout incidents before disasters | Unknown | 80% reduction |
| Relief item losses / unaccounted items | Unknown | 90% reduction |
| Donor reporting preparation time | Weeks | ≤ 2 days |

---

## 24. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | Poor internet connectivity in rural districts | High | High | PWA offline mode; low-bandwidth design; SMS fallback; scheduled sync windows |
| 2 | Low user adoption / resistance to change | High | High | Change management; training; super-user network; executive sponsorship; simple UX |
| 3 | Data entry errors during digitisation | Medium | High | Bulk import validation; barcode/QR scanning; mandatory fields; cycle counts |
| 4 | Cybersecurity breach / unauthorised access | Low | Critical | MFA, RBAC, RLS, encryption, penetration testing, security monitoring |
| 5 | Vendor lock-in / hosting dependency | Medium | Medium | Cloud-agnostic architecture; open-source stack; data export; migration plan |
| 6 | Integration delays with external systems | Medium | Medium | Well-documented APIs; phased integration; fallback manual processes |
| 7 | Device availability in districts | Medium | High | PWA works on existing phones/tablets; procurement plan for district tablets |
| 8 | Power outages affecting field use | High | Medium | Offline-first mobile app; power banks; low-power devices |
| 9 | Inaccurate master data (warehouses, SKUs) | Medium | High | Data cleansing workshop; validation rules; regional review process |
| 10 | Budget / procurement delays | Medium | High | Phased implementation; clear MVP scope; strong business case |

---

## 25. Quality Assurance & Testing Strategy

### 25.1 Testing Levels

| Level | Scope | Tools |
|-------|-------|-------|
| Unit Testing | Functions, utilities, business logic | Jest, Vitest |
| Integration Testing | API endpoints, database policies, auth flows | Playwright API, Postman |
| End-to-End Testing | Critical user journeys | Playwright |
| Accessibility Testing | WCAG 2.1 AA compliance | axe-core, Lighthouse |
| Performance Testing | Load, stress, low-bandwidth simulation | k6, Lighthouse |
| Security Testing | Vulnerability scans, penetration test | OWASP ZAP, Burp Suite, third-party pentest |
| User Acceptance Testing | NADMO stakeholders pilot real scenarios | Manual, scripted scenarios |

### 25.2 Critical Test Scenarios

1. User login with MFA across all roles.
2. Stock intake and dispatch with barcode/QR scanning.
3. Transfer order creation, approval, dispatch, tracking, and receipt.
4. Discrepancy reporting and reconciliation.
5. Critical stock alert generation and SMS delivery.
6. National dashboard drill-down and report export.
7. Offline data capture and background sync.
8. RLS policy enforcement — users cannot access unauthorised warehouses.
9. Audit log immutability and hash chain integrity.
10. Bulk import of users, SKUs, and warehouses.

### 25.3 UAT Acceptance Criteria

- 100% of core user stories pass UAT.
- Zero critical or high-severity defects.
- ≤ 5 medium-severity defects with documented workarounds.
- User satisfaction score ≥ 4.0 / 5.0.
- System performance meets NFRs under UAT load.

---

## 26. Training & Change Management

### 26.1 Training Programme

| Audience | Format | Duration | Content |
|----------|--------|----------|---------|
| HQ Executives | Executive briefing | 2 hours | Dashboards, reports, approvals |
| Regional Managers | Workshop + hands-on | 1 day | Regional oversight, approvals, discrepancy resolution |
| District Officers | Field training | 2 days | Stock intake/dispatch, transfers, mobile usage, offline sync |
| Field Officers | Field training | 1 day | Mobile app, GPS, photo capture, signatures |
| Auditors | Workshop | 1 day | Audit logs, reports, exports |
| System Admins | Technical training | 3 days | User management, security, backups, integrations |

### 26.2 Change Management Approach

- **Executive sponsorship**: Director-General champions the platform.
- **Super-user network**: At least one super-user per region and district.
- **Help desk**: Dedicated support channel during rollout.
- **Quick reference guides**: Laminated cards for district warehouses.
- **Feedback loop**: Monthly user feedback sessions and product improvements.
- **Incentives**: Recognition for high-adoption districts and accurate data.

### 26.3 Training Materials

- Video tutorials (English + local languages).
- Interactive user manual embedded in the app.
- Printable quick-start guides.
- Sandbox environment for practice.
- FAQ and troubleshooting knowledge base.

---

## 27. Support & Maintenance

### 27.1 Support Tiers

| Tier | Issue Type | Response Time | Resolver |
|------|------------|---------------|----------|
| L1 | Password resets, login issues, basic how-to | ≤ 4 hours | NADMO IT / Helpdesk |
| L2 | Feature bugs, data issues, report problems | ≤ 8 hours | Vendor support team |
| L3 | Security incidents, performance degradation, integration failures | ≤ 2 hours | Vendor engineering + NADMO IT |

### 27.2 Maintenance Windows

- Routine updates: Monthly, scheduled off-peak.
- Security patches: As needed, with emergency change process.
- Major releases: Quarterly, with 2-week notice.

---

## 28. Budget & Estimation Framework

> Note: The following is an indicative framework for procurement planning. Detailed costs will be provided in the commercial proposal.

### 28.1 Cost Categories

| Category | Description |
|----------|-------------|
| Software Development | Design, frontend, backend, mobile app, integrations |
| Cloud Infrastructure | Hosting, database, storage, CDN, SMS, monitoring (Phase 1) |
| Security & Compliance | Penetration testing, security audit, compliance review |
| Data Migration & Onboarding | Master data cleansing, bulk import, training |
| Change Management | Training materials, workshops, super-user network |
| Support & Maintenance | L2/L3 support, updates, enhancements |
| Hardware (Optional) | Tablets, barcode scanners, GPS trackers, IoT sensors |

### 28.2 indicative Team Structure

| Role | Effort |
|------|--------|
| Product Manager | Full-time |
| Solutions Architect | Full-time (Months 1–3), part-time thereafter |
| UX/UI Designer | Full-time (Months 1–4) |
| Frontend Engineers (Next.js) | 2 full-time |
| Backend Engineers (Supabase/PostgreSQL) | 2 full-time |
| Mobile Engineer (Android/Flutter) | 1 full-time (Months 4–10) |
| DevOps / Security Engineer | 1 full-time |
| QA Engineer | 1 full-time |
| Data / ML Engineer | Part-time (Months 6–12) |

---

## 29. SMS Notification Templates (Arkesel)

**Provider:** Arkesel (arkesel.com) — Ghana-local SMS API  
**Sender ID:** `NADMO-WMS` (registered branded sender ID)

| Event | Recipients | Message |
|-------|------------|---------|
| Critical stock alert | District Officer, Regional Manager, HQ Logistics | `NADMO ALERT: [Warehouse] critically low on [Item]. [X] units left. Act: wms.nadmo.gov.gh` |
| Amber stock warning | District Officer, Regional Manager | `NADMO WARNING: [Warehouse] [Item] approaching min level ([X] units). Review stock.` |
| Transfer approved | Requestor | `Transfer #[ID] APPROVED by [Name]. Assign vehicle now. NADMO-WMS.` |
| Transfer rejected | Requestor | `Transfer #[ID] REJECTED by [Name]. Reason: [reason]. Login for details.` |
| Transfer dispatched | Destination Officer, Regional Manager | `Transfer #[ID] dispatched to [Warehouse]. Expected: [Date]. Waybill ready.` |
| Transfer overdue | Regional Manager, HQ Logistics | `OVERDUE: Transfer #[ID] to [Warehouse]. Expected: [Date]. Investigate now.` |
| Discrepancy raised | Regional Manager, HQ Logistics, Auditor | `DISCREPANCY: Transfer #[ID]. Dispatched [X], received [Y]. Action required.` |
| Approval SLA breach | Next approver, HQ Admin | `ACTION REQUIRED: Transfer #[ID] awaiting approval (escalated). wms.nadmo.gov.gh` |
| Receipt confirmed | Source Officer, HQ Logistics | `Transfer #[ID] received at [Warehouse]. [X] items confirmed. NADMO-WMS.` |
| Expiry warning | District Officer, Regional Manager | `NADMO: [Item] at [Warehouse] expires in [X] days. Prioritise dispatch.` |

**Technical Notes:**

- API: Arkesel SMS API v2 — `POST /api/v2/sms/send`
- Messages kept ≤ 160 characters where possible (single SMS unit).
- Phone numbers normalised to E.164 format (`+233XXXXXXXXX`).
- Rate limit: max 10 SMS per user per hour; max 100 SMS per organisation per hour.
- Fallback: if Arkesel unreachable, event queued and retried every 5 minutes; in-app notification always fires.

---

## 30. Bulk Data Import Specifications

### 30.1 Import Types Available from Launch

| Data Type | Format | Template Fields |
|-----------|--------|-----------------|
| SKU Catalogue | CSV/Excel | `sku_code`, `name`, `category_code`, `unit_of_measure`, `description`, `weight_kg`, `volume_m3`, `shelf_life_days`, `image_url` |
| Warehouse Directory | CSV/Excel | `code`, `name`, `type`, `region_code`, `district_name`, `address`, `latitude`, `longitude`, `manager_email`, `phone`, `capacity_m3` |
| User Accounts | CSV/Excel | `email`, `phone`, `first_name`, `last_name`, `role_code`, `warehouse_codes`, `region_code` |
| Opening Stock Balances | CSV/Excel | `warehouse_code`, `sku_code`, `batch_lot`, `quantity`, `expiry_date`, `storage_location` |

### 30.2 Import Validation Rules

- Duplicate codes flagged before import.
- Missing required fields highlighted.
- Invalid references (e.g., non-existent warehouse) rejected.
- Preview mode showing valid (green), warning (amber), error (red) rows.
- Partial import: valid rows imported; error rows skipped with downloadable error report.
- Max file size: 10 MB; max rows: 10,000 per import.
- All imports logged in audit trail.

---

## 31. Open Items & Decisions Log

| # | Item | Decision | Owner | Status |
|---|------|----------|-------|--------|
| 1 | Threshold defaults | System-configurable with pre-loaded defaults per tier; editable by authorised users | HQ Logistics | Resolved |
| 2 | Approval workflow | Hierarchical 4-tier matrix (Routine → Regional → HQ → Director); editable by HQ Admin | DG Office | Resolved |
| 3 | SMS gateway | Arkesel (Ghana-local) | IT | Resolved |
| 4 | Hosting environment | Vercel + Supabase Cloud (Phase 1); GovTech Ghana migration path (Phase 2) | NITA / NADMO | Resolved |
| 5 | SKU catalogue | Manual entry + CSV/Excel bulk import from launch | HQ Logistics | Resolved |
| 6 | Existing data migration | No legacy data at launch; bulk import capability available at any time | Project Team | Resolved |
| 7 | Internet connectivity | Low-bandwidth resilience; full offline sync in Phase 2 | Architecture | Resolved |
| 8 | Ghana mapping data | OpenStreetMap (OSM) with Mapbox/Leaflet | Architecture | Resolved |
| 9 | GPS vehicle tracking | Core Phase 1 feature via driver mobile app + GhanaPost GPS | Architecture | Resolved |
| 10 | Barcode/QR scanning | Core Phase 1 via PWA camera + optional Bluetooth scanner | Architecture | Resolved |
| 11 | MFA enforcement | Required for HQ, Regional, Auditor; recommended for District | Security | Resolved |
| 12 | Predictive analytics | Phase 2 ML-driven forecasting and recommendations | Data/ML | Resolved |

---

## 32. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **FEFO** | First-Expiry-First-Out — stock dispatch method prioritising items closest to expiry |
| **GIFMIS** | Ghana Integrated Financial Management Information System |
| **MFA** | Multi-Factor Authentication |
| **MMDA** | Metropolitan, Municipal, and District Assembly |
| **NADMO** | National Disaster Management Organisation |
| **NEMA** | National Emergency Management Organisation (Ghana) |
| **NITA** | National Information Technology Agency |
| **PWA** | Progressive Web Application |
| **RLS** | Row-Level Security (database access control) |
| **SKU** | Stock Keeping Unit |
| **SLA** | Service Level Agreement |
| **TOTP** | Time-based One-Time Password |
| **WMS** | Warehouse Management System |

### Appendix B: Reference URLs

- NADMO: https://www.nadmo.gov.gh
- NITA: https://nita.gov.gh
- Ghana Data Protection Commission: https://dataprotection.gov.gh
- Ghana Meteorological Agency: https://www.meteo.gov.gh
- GhanaPost GPS: https://www.ghanapostgps.com
- OpenStreetMap: https://www.openstreetmap.org
- Arkesel: https://arkesel.com
- Supabase: https://supabase.com

### Appendix C: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 2026 | Initial Team | First draft |
| 1.1 | June 2026 | Product Team | Resolved open items, added hosting details |
| 2.0 | June 2026 | Solutions Architecture Team | Complete rewrite: architecture, security, AI/ML, compliance, roadmap, KPIs, risk register |

---

## 33. Conclusion

The NADMO Integrated Warehouse & Logistics Management System (NADMO-WMS) represents a transformational investment in Ghana’s disaster preparedness and response capability. By digitising every warehouse, tracking every movement, and providing real-time national visibility, NADMO-WMS will:

- Save lives by ensuring faster, more coordinated disaster response.
- Protect public resources through immutable accountability and reduced losses.
- Strengthen donor confidence with transparent, instant reporting.
- Position NADMO as a regional leader in humanitarian logistics technology.

This PRD provides a comprehensive, procurement-ready blueprint for building an award-winning, government-grade logistics platform. The architecture is secure, scalable, sovereign, and designed for the realities of Ghana’s operating environment — from high-speed HQ offices to low-bandwidth district warehouses.

**Next Steps:**

1. Executive review and approval of PRD v2.0.
2. Technical architecture deep-dive with NITA and NADMO IT.
3. Commercial proposal and procurement process.
4. Project kick-off and Phase 1 development.

---

*NADMO-WMS PRD v2.0 — Ready for Development, Procurement, and Government Review.*

*Prepared for: National Disaster Management Organisation (NADMO), Republic of Ghana*

*Classification: Confidential — For Government Review*

---
