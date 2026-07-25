# Phase 1 — Home Data Audit

## Current routes

| Route | Surface | Fate |
|-------|---------|------|
| `/dashboard` | Demo `CommandCenter` (fake brief, demo badges) | Redirect → `/home` |
| `/peers` | AI Team list | Unchanged (post-login was `/peers`, becomes `/home`) |
| `/auth/post-login` | Resolves destination | → `/home` when peers exist |

## Home section → data source

| Section | Real source | Fallback (honest) |
|---------|-------------|-------------------|
| **Morning Narrative** | Derived from `needsYou`, `recentMovement`, greeting, optional `lastVisitAt` | New user: welcome + link to team/onboarding |
| **Needs You** | `resolveMarketingWorkflowFocus` per Marketing peer + workspace session state | Hidden when empty |
| **Suggested Start** | Highest-priority Needs You item | Open first Marketing peer, or `/website-intelligence` if no peers |
| **Team Pulse** | Supabase `peers` + Marketing: workflow focus from session storage | Non-Marketing: DB status only, template “Open workspace…” — no fake work |
| **Recent Movement** | Aggregated `activityFeed` from Marketing peer session storage | “No recent activity yet” |
| **Context Health** | `fetchMarketingUnderstanding()` API | “Business context not loaded yet” + Knowledge link |
| **Active Workstreams** | Marketing peer `plan` + timeline progress from session storage | Hidden when no plan |

## Not fabricated

- No demo-insight badges
- No `RECOMMENDED_ACTIONS` demo list
- No fake team activity column
- No invented savings/metrics
- Non-Marketing peers do not show simulated campaigns

## Unsupported (honest empty states)

- Cross-peer inbox (Phase 2) — Needs You built from per-peer workflow, not unified inbox table
- Real “last active” timestamps for peers — use activity feed timestamps where available
- Org-wide workstream beyond Marketing session state — only Marketing peers with persisted plan

## Expected file changes

**Create:** `app/home/page.tsx`, `features/home/*`, `lib/home/*`, `lib/i18n/*`, `components/design-system/PgMorningNarrative.tsx`, `PgNeedsYou*.tsx`, `PgSuggestedStart.tsx`, `PgTeamPulse.tsx`, `PgRecentMovement.tsx`, `PgContextHealth.tsx`, `PgActiveWorkstreams.tsx`, `PgHomeSkeleton.tsx`, `docs/architecture/PHASE_1.md`

**Modify:** `lib/auth/post-login.ts`, `lib/auth/routes.ts`, `components/Sidebar.tsx`, `app/dashboard/page.tsx`, `AGENTS.md`, `docs/IMPLEMENTATION.md`

**Unchanged:** `lib/marketing-workspace/*` workflow, marketing workspace view, Phase 0 components
