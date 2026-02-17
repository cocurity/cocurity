# AGENTS.md — Cocurity Repo Agent Rules

Read this file first. These rules are the project source of truth for coding agents.

## 1) Command Policy (strict)
- Ask for user approval before running terminal commands.
- Keep commands minimal and task-focused.
- Do not run destructive commands unless explicitly requested.

## 2) Product Guardrails
- Do not change API contracts defined in `README.md` and `PRD.md`.
- Keep dependencies minimal; ask before installing new packages.
- Never expose raw secrets in API responses or UI.
- Hints must remain principle-level (no exploit steps, no exact secret/config leakage).
- Do not claim “100% secure”.

## 3) Current App Scope
- Brand: `Cocurity`
- Core flows:
  - Scan public GitHub repos
  - Render findings and issue reports
  - Certificate issuance/verification
  - Notify maintainer + gift checkout flow
  - My page for Cocurity Fix tracking and reports

## 4) Current Routes
- `/` Home
- `/scan`
- `/scan/[scanId]`
- `/r/[reportId]`
- `/verify`
- `/verify/[certId]`
- `/pricing`
- `/pricing/success`
- `/mypage`
- `/changelog`
- `/ui`

## 5) API Contracts (must remain stable)
- `POST /api/scan` `{ repoUrl } -> { scanId }`
- `GET /api/scan/:scanId` `-> { scan, findings[] }`
- `POST /api/scan/:scanId/rescan` `-> { scanId }`
- `POST /api/certificate` `{ scanId } -> { certId }`
- `GET /api/verify/:certId` `-> { status, certificate, scanSummary }`
- `POST /api/fix-request` `{ scanId, contact, urgency, notes } -> { requestId }`
- `GET /api/products` `-> { oneTime: Product[], subscription: Product[] }`
- `POST /api/checkout/session` `{ mode, email, items|slug, ... } -> { url, sessionId }`
- `GET /api/checkout/session/verify` `?session_id -> { type, status, amount, items }`
- `POST /api/webhooks/stripe` Stripe webhook (signature verified)
- `GET /api/orders` `?email -> { orders[] }`

## 6) Engineering Rules
- Use TypeScript-safe changes.
- Preserve App Router conventions.
- Prefer incremental patches over broad rewrites.
- Run lint/tests after edits when approved by user.

## 7) UI/UX Rules
- Keep loading/error/empty states clear.
- Maintain Cocurity visual style consistency.
- Keep copy concise and professional.

## 8) Documentation Discipline
- If product behavior changes, update:
  - `README.md`
  - `PRD.md`
  - this `AGENTS.md`
in the same work cycle.

## 9) Product Catalog Source
- Products are DB-driven via Prisma `Product` records.
- Seed baseline products with `npx prisma db seed`.
- Stripe checkout uses dynamic `price_data` from DB product fields.
