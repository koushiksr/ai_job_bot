# JobFlux AI — Web Frontend & Candidate Automation Studio

Autonomous recruitment intelligence platform and candidate portal for JobFlux AI, featuring automated job application pipeline tracking, Harvard/FAANG ATS resume studio, promotional campaign delivery, and administrator telemetry.

## Project Structure

```
.
├── docs/                      # Technical Documentation & Architecture
│   ├── AGENTS.md              # Autonomous agent roles & execution protocols
│   └── SYSTEM_ARCHITECTURE.md # Full system architecture specification
├── public/                    # Static Assets
│   ├── images/                # Consolidated image & SVG branding assets
│   │   ├── icon.png           # 512x512 High-DPI PNG brand emblem
│   │   └── icon.svg           # Scalable vector brand emblem
│   ├── icon.png               # Root static asset alias
│   └── icon.svg               # Root static asset alias
└── src/
    ├── app/                   # Next.js App Router (Pages & API Routes)
    │   ├── admin/             # Admin console & queue management
    │   ├── api/               # Serverless API endpoints
    │   ├── dashboard/         # Candidate real-time tracking dashboard
    │   ├── pricing/           # Subscription tiers & Razorpay checkout
    │   ├── profile/           # Candidate profile & preferences editor
    │   ├── resume-builder/    # Harvard single-column ATS resume studio
    │   ├── tools/             # ATS score checker & Naukri headline tools
    │   └── icon.svg           # Next.js App Router metadata icon
    ├── components/            # Reusable React UI components
    │   └── index.ts           # Central barrel export
    └── lib/                   # Core business logic, db & mail helpers
        └── index.ts           # Central barrel export
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run local development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Documentation

- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Agent Specifications](docs/AGENTS.md)
