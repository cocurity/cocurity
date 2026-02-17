# Cocurity

Fullstack MVP for repository security scanning, certificate verification, and fix-request checkout flow.

## Current Product Scope
- Two scan modes:
  - `Pre-Launch Security Audit`
  - `Open Source Risk Check`
- GitHub public repo scan with:
  - score / grade / verdict
  - findings (`severity`, `location`, `riskSummary`, `hint`, `confidence`)
- Certificate issuance and verification:
  - certificate ID format: `LP-XXXX-XXXX`
  - certificate image output in `public/certs`
  - verification page with status (`valid`, `outdated`, `invalid`)
- Share flow for maintainers:
  - notify message
  - gift-pack checkout flow for remediation/certification
- User workspace (`My page`):
  - local login toggle
  - Cocurity Fix request status tracking
  - report history

## App Routes
- `/` Home
- `/scan` Scan workspace
- `/scan/[scanId]` Scan result
- `/r/[reportId]` Issue report detail
- `/verify` Certificate search
- `/verify/[certId]` Certificate verification detail
- `/pricing` Checkout UI (simulated payment UX)
- `/mypage` User workspace (local-state based)
- `/changelog` Changelog page
- `/ui` UI showcase

## API Contracts (kept stable)
- `POST /api/scan` `{ repoUrl } -> { scanId }`
- `GET /api/scan/:scanId` `-> { scan, findings[] }`
- `POST /api/scan/:scanId/rescan` `-> { scanId }`
- `POST /api/certificate` `{ scanId } -> { certId }`
- `GET /api/verify/:certId` `-> { status, certificate, scanSummary }`
- `POST /api/fix-request` `{ scanId, contact, urgency, notes } -> { requestId }`

## Scoring Rules
- Base score: `100`
- `critical`: `-30` each
- `warning`: `-10` each
- Grade / verdict:
  - critical `>= 1` => `Block` / `blocked`
  - critical `= 0` and warning `>= 1` => `Caution`
  - critical `= 0` and warning `= 0` => `Ready`

## Scanner Rules (MVP)
- Sensitive filenames: `.env`, `*.pem`, `keystore`, `credentials`, `serviceAccount*.json`
- Secret patterns: `sk-`, `AKIA`, `BEGIN PRIVATE KEY`, `MNEMONIC`, `PRIVATE_KEY`
- Risky config hints: `Access-Control-Allow-Origin: *`, `cors: *`, `publicRead`, `allow all`
- Limits:
  - max files scanned: `200`
  - max fetched text: `2MB`

## Security Output Policy
- Principle-level hints only
- No raw secret exposure in API/UI
- No step-by-step exploit/fix disclosure in findings

## Feature Flags
Frontend:
- `NEXT_PUBLIC_FF_FIX_ENABLED=0|1`
- `NEXT_PUBLIC_FF_CERT_ENABLED=0|1`

Backend:
- `FF_FIX_ENABLED=0|1`
- `FF_CERT_ENABLED=0|1`
- `FF_AI_SUMMARY_ENABLED=0|1` (optional)
- `GITHUB_TOKEN` (optional, for higher API limits)

## Tech Stack
- Next.js App Router + TypeScript
- TailwindCSS
- Prisma + PostgreSQL (Vercel Postgres)
- Vercel Blob (certificate image storage)
- Next Route Handlers (`app/api/*`)

## Run Locally
1. `npm install`
2. `cp .env.example .env`
3. `npm run dev:up`

### Dev Scripts
| Command | Description |
|---------|-------------|
| `npm run dev:up` | Start DB (Docker) → migrate → dev server |
| `npm run dev:reset` | Full DB reset with seed data |
| `npm run dev:down` | Stop DB container |

> Requires Docker. PostgreSQL runs via `docker-compose.yml`.
