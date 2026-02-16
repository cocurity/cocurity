# AGENTS.md — Instructions for coding agents (Codex)

Codex: Read this file first and follow it strictly.

## 0) Role selection (IMPORTANT)
This repo is built by two humans:
- Funzy: mainly FRONTEND implementation
- Fullstack dev: BACKEND + infra + scanner engine + cert generator + deployment

When you start a task, set your role:
- If env `NEXT_PUBLIC_AGENT_ROLE` exists, follow it (frontend/backend/both).
- Otherwise, infer role by files you touch:
  - Frontend work: `/app/**` pages, `/components/**`, `/src/lib/apiClient.ts`, `/src/mocks/**`, UI/UX, types
  - Backend work: `/app/api/**`, `/prisma/**`, DB, scanner engine, certificate PNG generation

If env is `both`, implement end-to-end while keeping API contracts fixed.
If still ambiguous, ASK ONE SHORT QUESTION: "Should I act as frontend or backend for this task?"

## 1) Safety rules (non-negotiable)
- Never run destructive commands (rm -rf, delete system files, format drives).
- Ask before running ANY terminal command beyond:
  - `npm install`
  - `npm run dev`
  - `npm run lint`
  - `npm run test`
  - `npx prisma migrate dev`
- Never hardcode secrets. Use `.env.local` and `.env.example`.
- Do not claim “100% secure”. This is a best-effort preflight checker.

## 2) Shared product rules
### Hint policy
- Output only principle-level hints.
- Do NOT output code diffs, exact config values, or step-by-step fixes.
- Never reveal raw secrets; mask/omit.

### Scoring
- Base 100
- Critical: -30 each
- Warning: -10 each
- Grade/Verdict:
  - Critical >= 1 => Block (🔴) verdict=blocked
  - Critical = 0 & Warning >= 1 => Caution (🟡)
  - Critical = 0 & Warning = 0 => Ready (🟢)

### Certificate rules
- Issue certificate only if critical == 0
- Provide anti-forgery verification:
  - PNG includes certId + Verify URL + QR
  - Public `/verify` and `/verify/[certId]` must validate

## 3) FRONTEND agent instructions (role=frontend)
DO:
- Next.js App Router pages and UI components (Tailwind)
- Loading/empty/error UX states
- Typed API client (single fetch wrapper)
- Types for API contracts
- Mock mode for demo (`NEXT_PUBLIC_FF_MOCK=1`) with deterministic responses
- Feature-flag gated UI for Fix/Certificate buttons

DO NOT:
- Implement DB/Prisma schema
- Implement scanner engine logic
- Implement certificate PNG generation (backend provides endpoint)
- Change API contracts

Required routes:
- `/` dashboard
- `/scan` input
- `/scan/[scanId]` result
- `/verify` search
- `/verify/[certId]` verify detail
- `/changelog` static list (5+ items)

Frontend feature flags:
- NEXT_PUBLIC_FF_MOCK=0|1
- NEXT_PUBLIC_FF_FIX_ENABLED=0|1
- NEXT_PUBLIC_FF_CERT_ENABLED=0|1

Mock mode requirements:
- Provide 2 scenarios:
  1) Risky => Blocked (has critical findings)
  2) Safe  => Ready (critical=0) so certificate CTA can show
- Keep mocks typed and in `src/mocks/`.

Output discipline (frontend):
- After changes: list files changed + how to run + what remains.

## 4) BACKEND agent instructions (role=backend)
DO:
- Implement API routes in `/app/api/**` following contracts
- Implement Prisma + SQLite schema and migrations
- Implement rule-based scanner engine (MVP quick wins)
- Implement caching by repoUrl+commitHash (+ scanConfigVersion)
- Implement certificate issuance:
  - generate PNG server-side (simple template ok)
  - embed certId, issuedAt, repoUrl, commit(7), score, grade, Verify URL, QR
  - store png under `/public/certs/{certId}.png`
- Implement verify endpoints & status: valid/revoked/expired/not_found
- Implement simple rate limiting & friendly error messages (MVP-level)

DO NOT:
- Change API contracts
- Store full repo code permanently (minimize storage; store only findings)
- Return raw secret values in findings

Backend feature flags:
- FF_AI_SUMMARY_ENABLED=0|1 (optional)
- FF_FIX_ENABLED=0|1
- FF_CERT_ENABLED=0|1
- GITHUB_TOKEN optional for rate limits (do not require)

Scanner MVP rules (minimum):
- Sensitive filenames: .env, *.pem, keystore, credentials, serviceAccount*.json
- Secret patterns: sk-, AKIA, BEGIN PRIVATE KEY, MNEMONIC, PRIVATE_KEY
- Risky config hints: cors *, Access-Control-Allow-Origin: *, publicRead, allow all
- Always output: severity, location(file path), riskSummary(1 sentence), hint(1 sentence), confidence

Output discipline (backend):
- After changes: list files changed + DB migration status + how to run + test curl examples.
