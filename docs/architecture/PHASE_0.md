# Phase 0 — Review Loop Fix

**Status:** Complete  
**Goal:** Review actions remain visible while inspecting supporting context (plan, strategy, reasoning).

## Problem

Opening campaign plan during draft review used a full-screen `DetailSlideOver` (z-50), covering the approve/reject actions. Users hit a dead end.

## Solution

1. **`PgReviewBar`** — Fixed to viewport bottom (`z-40`), above mobile safe area, offset for sidebar on desktop (`lg:left-64`). Mounted at workspace level whenever `deliverable.reviewable === true`. Never inside slide-over or inspector.

2. **`PgInspector`** — Inline panel (360px) beside work surface on desktop; bottom sheet above review bar on mobile. Shows same content as slide-over (`MarketingDetailSlideOverContent`) but does not block review actions.

3. **Routing** — `resolveDetailPanelTarget(isReviewActive)`:
   - Review active → `PgInspector`
   - Otherwise → `DetailSlideOver` (Details accordion, activity feed, documents)

4. **Review context actions** — During review, draft shows ghost buttons: View campaign plan, View strategy, Why this post?

## Architectural decisions

| Decision | Rationale |
|----------|-----------|
| Review bar at `MarketingWorkspaceView` level | Single mount point; survives inspector open/close |
| Reuse `MarketingDetailSlideOverContent` in inspector | No duplicate rendering logic; workflow untouched |
| Keep `DetailSlideOver` for non-review | Phase 0 scope; accordion/details unchanged |
| Pure routing in `lib/peer-experience/marketing/review-panel-routing.ts` | Testable; no UI in lib |
| Remove `ReviewActionBar` | Superseded by `PgReviewBar`; one review bar implementation |

## What was not changed

- `lib/marketing-workspace/*` — workflow, storage, publication, recommendations
- `handleDraftStatus` / approve-reject business logic
- Details accordion, activity feed, conversation, timeline

## Verification

- Unit tests: `review-panel-routing.test.ts`
- Manual: review draft → View campaign plan → approve/reject still visible and functional
- Existing test suite must pass

### Phase 0 validation (final)

Two defects found during validation and fixed:

1. **`--pg-color-text-inverse` missing** — primary approve button text had no token; added to `globals.css`.
2. **Inspector focus trap blocked review bar** — Tab could not reach approve/reject while inspector open; `PgInspector` defaults `focusTrap={false}` so keyboard users can reach `PgReviewBar`.

Duplicate `DeliverableReviewContextAction` type removed from `DeliverableContent.tsx` (uses shared type from `lib/peer-experience`).

## Phase 1+ (out of scope)

- Replace remaining slide-over usage with inspector everywhere
- `/home`, `/inbox`, full Peer Studio shell
