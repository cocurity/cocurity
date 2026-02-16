# LaunchPass — MVP PRD (One-Pager)

## Goal
Ship a working URL demo today:
Public GitHub repo scan -> results -> rescan -> (if pass) certificate -> verify/search.

## Must-have (Acceptance Criteria)
1) User can paste a public GitHub repo URL and start scan.
2) Result page loads within ~30s (or shows friendly error if limited).
3) Result page shows:
   - Score (0–100)
   - Grade: 🟢 Ready / 🟡 Caution / 🔴 Block
   - Verdict: Launch Ready / Blocked
4) Findings list shows, per item:
   - severity (critical|warning)
   - location (file path)
   - riskSummary (1 sentence)
   - hint (principle-level only; no code/diff/exact config)
   - confidence (high|medium|low)
5) Rescan works:
   - Backend caches by repoUrl + commitHash (+ scanConfigVersion)
   - Frontend provides a rescan button
6) Certificate (feature-flagged, but implemented):
   - Issue only if critical == 0
   - Generates PNG certificate containing:
     - certId, issuedAt, repoUrl, commit(7 chars), score, grade
     - Verify URL + QR pointing to /verify/:certId
7) Public verification:
   - /verify/:certId shows status: valid / revoked / expired / not found
   - /verify search page allows certId lookup
8) /changelog exists with 5+ items.

## API contracts (fixed)
POST /api/scan                  { repoUrl } -> { scanId }
GET  /api/scan/:scanId          -> { scan, findings[] }
POST /api/scan/:scanId/rescan   -> { scanId }
POST /api/certificate           { scanId } -> { certId }
GET  /api/verify/:certId        -> { status, certificate, scanSummary }
POST /api/fix-request           { scanId, contact, urgency, notes } -> { requestId }

## Scoring & Grade
- Base 100
- Critical: -30 each
- Warning:  -10 each
- Grade:
  - Critical>=1 => Block (🔴) verdict=blocked
  - Critical=0 & Warning>=1 => Caution (🟡)
  - Critical=0 & Warning=0 => Ready (🟢)

## Hint policy (product rule)
- The product’s job is to pinpoint issues + give direction, not provide detailed fixes.
- Never output raw secrets; mask/omit.
- No “100% secure” claim.

## Roles / Responsibilities
Frontend (Funzy):
- Implement all MVP routes + Alyak-style UI
- Typed API client + types
- Mock mode for end-to-end demo without backend
- Loading/error/empty states
- Feature-flag UI for Fix/Certificate

Backend (Fullstack dev):
- Implement API endpoints
- DB + persistence
- Rule-based scanning engine (+ optional AI summary toggle)
- Cache by repo+commit
- Certificate issuance & PNG generation
- Verify/search endpoints
- Basic abuse protection + helpful errors

## Non-goals (MVP)
- Private repo OAuth/GitHub App
- Full payment integration (link-only OK)
- Deep security audit coverage
- Post-launch monitoring
