<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 🤖 JobFlux AI — Developer & Agentic IDE Guidelines

This document provides context and guidelines for autonomous agents, AI assistants (Cursor, Windsurf, Claude Code, GitHub Copilot, Antigravity), and human developers working on the **JobFlux AI Web Application**.

---

## 🌟 1. System Overview & Core Philosophy

JobFlux AI is an autonomous recruitment intelligence platform and candidate portal designed to streamline job search, resume formatting, and daily Naukri application sweeps.

- **Architecture**: Decoupled Cloud-Broker model.
- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Vercel Serverless.
- **Backend**: Python 3.12, Playwright, Gemini AI LLM, PyMongo (in sibling repository `naukri_ai_bot_automatic_job_apply`).
- **Database & Single Source of Truth**: MongoDB Atlas Cloud (`profiles`, `resumes`, `applied_jobs`, `emails`, `system_config`, `payments`).
- **Communication Principle**: There are no direct socket tunnels or inter-process RPCs. Frontend and Backend communicate solely through MongoDB Atlas state and REST APIs.

---

## 📂 2. Directory Structure & Asset Organization

```
naukri_ai_bot_automatic_job_apply_frontend/
├── docs/                      # Technical Documentation
│   ├── AGENTS.md              # Mirror copy of agent guidelines
│   └── SYSTEM_ARCHITECTURE.md # Full system architecture specification
├── public/                    # Static Public Assets
│   ├── images/                # Consolidated Brand Assets
│   │   ├── icon.png           # 512x512 High-DPI transparent PNG emblem
│   │   └── icon.svg           # Scalable vector brand emblem
│   ├── icon.png               # Root static asset alias (transparent PNG)
│   └── icon.svg               # Root static asset alias (vector SVG)
├── src/
│   ├── app/                   # Next.js 16 App Router (Pages & API Routes)
│   │   ├── admin/             # Administrator telemetry, queue & email controls
│   │   ├── api/               # Serverless backend endpoints
│   │   │   ├── admin/         # Admin queue, offers, mail-test, payments
│   │   │   ├── auth/          # Authentication & password reset pipeline
│   │   │   ├── payment/       # Razorpay order generation & verification
│   │   │   └── profile/       # Candidate profile & resume sync
│   │   ├── dashboard/         # Candidate real-time application tracking dashboard
│   │   ├── pricing/           # Tiered plans & Razorpay checkout modal
│   │   ├── profile/           # Candidate profile editor & preferences
│   │   ├── resume-builder/    # Harvard & FAANG single-column ATS resume studio
│   │   ├── tools/             # ATS score checker & headline generator
│   │   ├── icon.svg           # Next.js metadata icon file convention
│   │   ├── layout.tsx         # Root layout with OpenGraph & JSON-LD metadata
│   │   ├── manifest.ts        # PWA web app manifest
│   │   ├── robots.ts          # Automated robots.txt generator
│   │   └── sitemap.ts         # Automated sitemap.xml generator
│   ├── components/            # Reusable UI Components
│   │   └── index.ts           # Central barrel export
│   └── lib/                   # Shared Utilities & Data Access
│       ├── activityLogger.ts  # MongoDB audit logging
│       ├── adminAuth.ts       # Admin security verification
│       ├── mailService.ts     # Resend & Gmail SMTP dispatch engine
│       ├── mongodb.ts         # Cached MongoDB connection pool
│       ├── rateLimit.ts       # In-memory IP rate limiter
│       └── index.ts           # Central barrel export
├── AGENTS.md                  # This file (Agent & developer instructions)
├── README.md                  # Project overview & onboarding guide
└── SYSTEM_ARCHITECTURE.md     # In-depth architectural blueprint
```

---

## 🎨 3. Brand Assets & Email Deliverability Rules

1. **Canonical Logo**:
   - The authentic emblem is the **Obsidian Briefcase with Supersonic Delta Jet and glowing AI Apex Beacon**.
   - Vector Source: `src/app/icon.svg` / `public/images/icon.svg`.
   - Transparent High-DPI Raster: `public/images/icon.png` (512x512 with 100% true alpha transparency).
2. **Email Delivery Strict Constraint**:
   - Major email clients (Gmail mobile/web, Outlook) reject or block external `<img src="...svg">` tags.
   - **Always use `https://jobfluxai.vercel.app/icon.png` in HTML email templates**.
   - Display dimensions must remain prominent at `min 98x98 px` (`width="98" height="98"`) with responsive `.mobile-logo` constraints.

---

## ⚡ 4. Developer & Agent Rules of Engagement

1. **Do Not Delete Architecture or Agent Markdown Files**:
   - Files like `AGENTS.md`, `README.md`, and `SYSTEM_ARCHITECTURE.md` are critical for IDE context windows and future developer onboarding.
2. **Preserve Decoupled Architecture**:
   - Never introduce local subprocess calls or file-path dependencies between frontend and backend. Always use MongoDB Atlas collections.
3. **Build Integrity**:
   - Ensure `npm run build` succeeds with zero TypeScript or Turbopack errors before committing.
