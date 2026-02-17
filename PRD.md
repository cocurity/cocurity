# Cocurity — Current MVP PRD

## Product Goal
Provide a polished end-to-end flow for public repository security checks:

`scan -> findings/report -> notify/gift flow -> certificate/verification -> my page tracking`

## Primary User Flows
1. User runs scan from `/scan` in either mode:
   - Pre-Launch Security Audit
   - Open Source Risk Check
2. User views result at `/scan/[scanId]`.
3. User opens issue report `/r/[reportId]`.
4. User verifies certificate via `/verify` and `/verify/[certId]`.
5. User can start checkout from result actions (`Cocourity Fix`) and complete payment via Stripe Checkout at `/pricing`.
6. User sees Cocurity Fix request statuses in `/mypage`.

## Current Acceptance Criteria
1. Scan can start with public GitHub URL and returns `scanId`.
2. Scan result page always shows score/grade/verdict + counts.
3. Findings are rendered with:
   - `severity`, `location`, `riskSummary`, `hint`, `confidence`.
4. Dependency mode supports maintainer notification modal.
5. Gift checkout flow works:
   - select one-time gift options
   - complete payment via Stripe Checkout
   - return to result page with completion feedback.
6. Certificate issuance works when critical findings are zero.
7. Verify pages show trustworthy metadata + status (`valid`, `outdated`, `invalid`).
8. My page provides:
   - `My Cocurity Fix` status list
   - report history list
   - demo status progression controls.

## Fixed API Contracts
- `POST /api/scan` `{ repoUrl } -> { scanId }`
- `GET /api/scan/:scanId` `-> { scan, findings[] }`
- `POST /api/scan/:scanId/rescan` `-> { scanId }`
- `POST /api/certificate` `{ scanId } -> { certId }`
- `GET /api/verify/:certId` `-> { status, certificate, scanSummary }`
- `POST /api/fix-request` `{ scanId, contact, urgency, notes } -> { requestId }`
- `POST /api/checkout/session` `{ mode, email, ... } -> { url, sessionId }`
- `GET /api/checkout/session/verify` `?session_id -> { type, status, amount, items }`
- `POST /api/webhooks/stripe` Stripe webhook (signature verified)
- `GET /api/orders` `?email -> { orders[] }`

## Scoring & Verdict Rules
- Base: `100`
- Critical: `-30`
- Warning: `-10`
- Verdict:
  - `critical >= 1` => `blocked`
  - `critical = 0 && warning >= 1` => `caution`
  - `critical = 0 && warning = 0` => `ready`

## Scanner Constraints (MVP)
- Public GitHub repositories only
- Rule-based detection (no raw secret output)
- Limits:
  - max files: `200`
  - max text fetched: `2MB`
- Friendly errors for:
  - invalid URL
  - GitHub fetch failure
  - rate limit
  - oversized repository

## Checkout & Pricing (Current UX)
- Membership plans:
  - Plus `$19/month`
  - Pro `$49/month`
- One-time gift passes:
  - Cocurity Fix Pass `$149`
  - Certification Pass `$39`
  - bundle discount `$19` when both selected
- Payment processed via Stripe Checkout Session (real charges).

## Non-goals
- Private repo OAuth integration
- Enterprise RBAC/user identity backend
- Full remediation automation pipeline
