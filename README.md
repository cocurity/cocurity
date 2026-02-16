# LaunchPass (MVP)

Alyak-style pre-launch security checker for vibe-coded products.

## What it does
- Free: Scan a public GitHub repo and show:
  - Score (0–100)
  - Grade: 🟢 Ready / 🟡 Caution / 🔴 Block
  - Verdict: Launch Ready / Blocked
  - Findings list with location + risk summary + principle-level hint
- Paid (feature-flag): Fix request + Certificate issuance
- Certificate anti-forgery:
  - PNG certificate + Certificate ID
  - Verify URL + QR on the certificate
  - Public verify & search pages (anyone can validate)

## MVP routes
- `/` dashboard
- `/scan` repo URL input
- `/scan/[scanId]` scan result
- `/verify` search by certificate ID
- `/verify/[certId]` verify detail page
- `/changelog` static changelog (5+ items)

## Tech (single repo, fullstack)
- Next.js App Router + TypeScript
- TailwindCSS
- Prisma + SQLite (local dev)
- API via Next Route Handlers: `/app/api/*`

## API contracts (backend provides, frontend consumes)
POST `/api/scan`                  { "repoUrl": "..." } -> { "scanId": "..." }
GET  `/api/scan/:scanId`          -> { "scan": {...}, "findings": [...] }
POST `/api/scan/:scanId/rescan`   -> { "scanId": "..." }
POST `/api/certificate`           { "scanId": "..." } -> { "certId": "..." }
GET  `/api/verify/:certId`        -> { "status": "...", "certificate": {...}, "scanSummary": {...} }
POST `/api/fix-request`           { "scanId": "...", "contact": "...", "urgency": "...", "notes": "..." } -> { "requestId": "..." }

## Scoring (simple)
- Base score = 100
- Critical: -30 each
- Warning:  -10 each
- Grade/Verdict:
  - Critical >= 1 => Block (🔴) / Blocked
  - Critical = 0 & Warning >= 1 => Caution (🟡)
  - Critical = 0 & Warning = 0 => Ready (🟢)

## Hint policy (IMPORTANT)
- Hints are principle-level only.
- Do NOT provide code diffs, exact config values, or step-by-step fix instructions.
- Never display raw secrets (mask/omit).

## Feature flags (.env)
Frontend:
- NEXT_PUBLIC_AGENT_ROLE=frontend|backend  (optional, for Codex clarity)
- NEXT_PUBLIC_FF_MOCK=0|1
- NEXT_PUBLIC_FF_FIX_ENABLED=0|1
- NEXT_PUBLIC_FF_CERT_ENABLED=0|1

Backend:
- FF_AI_SUMMARY_ENABLED=0|1
- FF_FIX_ENABLED=0|1
- FF_CERT_ENABLED=0|1
- GITHUB_TOKEN=... (optional; to reduce rate limits; never required for basic MVP)

## Local run
- npm install
- npx prisma migrate dev
- npm run dev
