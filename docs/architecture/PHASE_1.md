# Phase 1 — Home

Peergent 2.0 morning command center at `/home`. Answers within ten seconds: what happened, what needs me, what is running, where to start.

## Architecture

```
app/home/page.tsx          → thin route
features/home/HomePage.tsx → layout + state branches
hooks/useHomePage.ts       → peers, understanding API, session snapshots
lib/home/build-home-view-model.ts → pure view model (no I/O)
components/design-system/Pg*.tsx    → presentation
```

Data flows **down** from Supabase peers + marketing understanding API + marketing workspace session storage. Nothing is invented in the UI layer.

## Sections → data sources

| Section | Source | Empty / unavailable |
|---------|--------|---------------------|
| Morning Narrative | Derived from needs-you, movement since last visit, greeting | Welcome copy for new org |
| Suggested Start | Top needs-you item, or first marketing workspace, or onboarding | `/website-intelligence` when no peers |
| Needs You | `resolveMarketingWorkflowFocus` per marketing peer snapshot | Section hidden |
| Team Pulse | DB peers + workflow focus (marketing) or status only (other roles) | Hidden when no peers |
| Recent Movement | Aggregated `activityFeed` from session storage | Honest empty message |
| Context Health | `fetchMarketingUnderstanding()` | Link to `/knowledge` |
| Active Workstreams | Plan + timeline nodes from session storage | Honest empty message |

## States

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Initial fetch | `PgHomeSkeleton` |
| Success | Peers loaded | Full home stack |
| Error | Peers fetch failed | Retry + link to team |
| Empty peers | Zero peers in org | Welcome narrative + onboarding CTA |
| Returning user | `localStorage` last visit + movement after timestamp | “While you were away…” narrative |
| All caught up | Peers exist, empty needs-you | Calm narrative |

## Routing changes

- Post-login default: `/home` (when peers exist)
- `/dashboard` → redirect to `/home`
- Sidebar: **Home** first (`/home`); legacy Briefing removed
- `/home` added to protected route prefixes

## Trade-offs

1. **Marketing workflow state is session-local.** Needs-you, movement, and workstreams reflect persisted marketing workspace in `sessionStorage`, not server-side inbox. Honest empty states when the user has not opened a marketing workspace this session.
2. **Non-marketing peers** show DB status and “open workspace” — no simulated campaigns or fake activity.
3. **Locale** copy is EN/NL-ready via `lib/i18n/home-copy.ts`; locale resolution defaults to `en` until account preferences expose language.
4. **Mobile** uses single-column layout; sidebar remains desktop-only (consistent with existing app shell).

## No fake UI

Confirmed:

- No demo badges, savings metrics, or placeholder analytics
- No simulated peer work for non-marketing roles
- No reuse of legacy `CommandCenter` demo data
- Team pulse “working” only when workflow focus is `generating` (not fabricated)

## Files

### Created

- `app/home/page.tsx`
- `features/home/HomePage.tsx`
- `features/home/README.md`
- `hooks/useHomePage.ts`
- `lib/home/types.ts`
- `lib/home/load-home-data.ts`
- `lib/home/build-home-view-model.ts`
- `lib/home/index.ts`
- `lib/home/__tests__/build-home-view-model.test.ts`
- `lib/i18n/home-copy.ts`
- `lib/i18n/index.ts`
- `components/design-system/PgMorningNarrative.tsx`
- `components/design-system/PgNeedsYou.tsx`
- `components/design-system/PgSuggestedStart.tsx`
- `components/design-system/PgTeamPulse.tsx`
- `components/design-system/PgRecentMovement.tsx`
- `components/design-system/PgContextHealth.tsx`
- `components/design-system/PgActiveWorkstreams.tsx`
- `components/design-system/PgHomeSkeleton.tsx`
- `docs/architecture/PHASE_1_AUDIT.md`
- `docs/architecture/PHASE_1.md`

### Modified

- `app/dashboard/page.tsx` — redirect to `/home`
- `components/design-system/index.ts` — export Home components
- `components/Sidebar.tsx` — Home nav item
- `lib/auth/post-login.ts` — default `/home`
- `lib/auth/routes.ts` — protect `/home`
- `AGENTS.md` — phase status
- `docs/IMPLEMENTATION.md` — phase status

### Removed

- None (legacy `CommandCenter` retained but unreachable via `/dashboard`)

## Tests

`lib/home/__tests__/build-home-view-model.test.ts` covers empty peers, draft review, while-away narrative, context unavailable, non-marketing honesty, and all-caught-up.

Run: `npm test` and `npx tsc --noEmit`.
