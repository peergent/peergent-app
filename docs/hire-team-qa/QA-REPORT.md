# Hire Team Experience — Visual QA Report (Sprint 2.2)

**Date:** 17 July 2026  
**Company fixture:** Linear (`https://linear.app`)  
**Review scope:** Business Brain → Hire Team journey (all beats)

---

## Summary

End-to-end QA completed. Eight real UI screenshots captured from the running app. Six defects fixed during this pass. Build passes. No Business Brain or journey redesign changes.

---

## 1. Visual issues found

| Issue | Severity | Status |
|---|---|---|
| Journey entrance animation replayed on session restore (flash on refresh) | Medium | **Fixed** — `animateEntry` only on fresh CTA click |
| Ambient glow on Ready screen could cause horizontal overflow on narrow viewports | Low | **Fixed** — reduced inset + `overflow-hidden` |
| Back link overlapped journey content on small screens | Low | **Fixed** — top padding when back link visible |
| Long company / peer names could overflow status rows | Low | **Fixed** — `break-words`, `truncate` on Ready rows |
| Section lacked `overflow-x-hidden` during hiring phase | Low | **Fixed** |
| Mobile safe-area bottom not respected | Low | **Fixed** — `env(safe-area-inset-bottom)` on section |

**No issues found requiring layout redesign** at 1440 / 1280 / 1024 / 390 / 375 / 360 widths during code review and screenshot verification.

---

## 2. Interaction issues found

| Issue | Severity | Status |
|---|---|---|
| Stale journey from prior assessment could restore on refresh after re-analyzing a different site | High | **Fixed** — `loadHireJourneyForAssessment()` validates `assessmentKey` |
| Double-click on personalisation options could advance twice | Medium | **Fixed** — `advancingRef` guard |
| Missing company name in assessment showed blank in copy | Medium | **Fixed** — hostname fallback → "your company" |
| Preparing sequence replays fully on refresh mid-beat | Low | **Accepted** — beat restores correctly; sequence replay is acceptable for v1 |

**Verified working (code + manual flow):**
- Both Hire Team CTAs → same `handleStartHireTeam()`
- Idempotent peer creation via stored peer IDs
- Refresh on Ready does not re-create peers
- Session clears only after successful exit to `/peers`
- Calm retry on creation failure

---

## 3. Accessibility issues found

| Issue | Severity | Status |
|---|---|---|
| Focus lost after beat transitions | Medium | **Fixed** — focus moves to beat live region after transition |
| Preparing status changes not announced | Medium | **Fixed** — `aria-live="polite"` region |
| Tap targets below 44px on option pills | Low | **Fixed** — `min-h-11` on options |
| Redundant Enter handler on Welcome button (double-fire risk) | Low | **Fixed** — removed |

**Verified:**
- Radio groups with `role="radiogroup"` / `role="radio"` / `aria-checked`
- Email input has associated label (sr-only)
- Decorative elements `aria-hidden`
- Reduced motion respected via existing CSS + hook

---

## 4. Edge cases fixed

- **No company name** → derives from hostname or "your company"
- **Mismatched assessment + journey** → journey discarded
- **TTL expired session** → cleared (existing behaviour)
- **Partial Sales create failure** → sales ID persisted, retry creates Marketing only (Sprint 2)
- **Double option click** → guarded

---

## 5. Files changed

- `app/website-intelligence/page.tsx`
- `components/hire-team/HireTeamJourney.tsx`
- `components/hire-team/HirePreparing.tsx`
- `components/hire-team/HirePersonalisation.tsx`
- `components/hire-team/HireReady.tsx`
- `components/hire-team/HireWelcome.tsx`
- `lib/hire-team/hire-team-storage.ts`
- `lib/hire-team/hire-team-presenter.ts`
- `lib/hire-team/hire-ui.ts`
- `package.json` / `package-lock.json` (playwright devDependency for QA capture)
- `scripts/capture-hire-screenshots.mjs` (QA tooling)
- `scripts/fixtures/linear-assessment.json` (QA fixture)
- `docs/hire-team-qa/` (report + screenshots)

---

## 6. Build result

```
npm run build — PASS (Next.js 16.2.10, TypeScript clean)
```

---

## 7. Test result

| Check | Result |
|---|---|
| Production build | Pass |
| Automated unit/integration tests | None in repo |
| Playwright screenshot capture | Pass (8/8 states) |
| Content audit (Agent/Bot/Deploy etc.) | Pass — none in hire-team UI |
| Copy consistency (AI team / AI Peer) | Pass |

---

## 8. Screenshots produced

### Desktop (1440×900)

| # | File | State |
|---|---|---|
| 1 | `docs/hire-team-qa/screenshots/desktop/01-welcome.png` | Welcome |
| 2 | `docs/hire-team-qa/screenshots/desktop/02-meet-the-team.png` | Meet the team |
| 3 | `docs/hire-team-qa/screenshots/desktop/03-preparing-active.png` | Preparing — active |
| 4 | `docs/hire-team-qa/screenshots/desktop/04-personalisation-crm.png` | Personalisation — CRM |
| 5 | `docs/hire-team-qa/screenshots/desktop/05-ready.png` | Ready |

### Mobile (390×844)

| # | File | State |
|---|---|---|
| 6 | `docs/hire-team-qa/screenshots/mobile/06-meet-the-team.png` | Meet the team |
| 7 | `docs/hire-team-qa/screenshots/mobile/07-personalisation-email.png` | Personalisation — email |
| 8 | `docs/hire-team-qa/screenshots/mobile/08-ready.png` | Ready |

**Regenerate:** `npm run dev` then `node scripts/capture-hire-screenshots.mjs`

---

## 9. Known limitations (remaining)

1. **Personalisation answers** are stored in sessionStorage only — not persisted to Supabase yet.
2. **Preparing beat** replays its sequence on refresh (beat position restores, animation restarts).
3. **Browser Back** from hiring returns to report visually but does not sync URL/history state (in-page phase only).
4. **Peer creation** requires live Supabase — cannot fully QA Creating/Ready peer list without backend.
5. **Playwright** added as devDependency for screenshot capture — not part of CI yet.

---

## Content QA notes

- Approved messaging preserved verbatim
- Company shown: **Linear** (from demo assessment)
- No placeholder lorem, raw keys, or Supabase errors in UI
- Integration labels (HubSpot, Google Analytics, etc.) are user-facing and intentional
