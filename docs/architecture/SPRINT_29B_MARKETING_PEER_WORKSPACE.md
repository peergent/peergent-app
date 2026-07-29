# Sprint 29B — Marketing Peer Colleague Workspace

**Status:** Implemented (presentation + IA refactor)  
**Authority:** [Colleague Experience Architecture](../product/PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md), [Presence Model](../product/PEERGENT_PRESENCE_MODEL.md)

## Summary

Marketing Peer at `/team/[peerId]` is now a six-section colleague workspace. Domain behavior (planner, executor, review, campaigns, persistence) is unchanged; customer navigation and presenters were refactored.

## Routes

| Section | Path | Notes |
|---------|------|--------|
| Working on (default) | `/team/[peerId]` | Replaces Overview dashboard |
| Waiting for me | `/team/[peerId]/waiting` | Decision inbox; `?deliverableId=` keeps inline ReviewTab |
| Done | `/team/[peerId]/done` | Outcome timeline from activity mapper |
| Work | `/team/[peerId]/work` | Campaigns / projects (unchanged capability) |
| Results | `/team/[peerId]/results` | Performance tab + honest empty state |
| Settings | `/team/[peerId]/settings` | Index + `?section=` for knowledge, connections, responsibilities, autonomy |

### Redirects (backward compatible)

- `/review` → `/waiting` (query preserved)
- `/performance` → `/results` (query preserved)
- `/knowledge`, `/connections`, `/responsibilities` (list) → `/settings?section=…`
- `/team/[peerId]/projects/...`, `/content/...`, responsibility detail, inspector, campaign review — unchanged

## Components

- `features/marketing-workspace/MarketingWorkspaceLayout.tsx` — colleague shell (presence + nav)
- `features/marketing-workspace/colleague/*` — section UI, nav, presence header
- `features/marketing-workspace/view-model/buildPeerWorkspaceColleagueViewModel.ts` — orchestration

## View models / mappers

- `lib/peer-experience/marketing/colleague/build-marketing-peer-presence.ts` — priority: Waiting → Blocked (knowledge) → Working (verified) → Preparing (active engagement) → Caught up
- `lib/peer-experience/marketing/colleague/build-marketing-peer-sections.ts` — Working on + Done grouping
- `features/marketing-workspace/lib/build-peer-attention-items.ts` — drafts queue + campaign review items

## Localization

- `lib/i18n/peer-workspace-copy.ts` (EN/NL section labels and empty states)
- Campaign presence strings remain in `lib/i18n/marketing-campaign-copy.ts`
- `NEXT_PUBLIC_PEERGENT_LOCALE` via existing `customerLocalePreferenceFromEnv()`

## Admin / customer

- Admin inspector and campaign technical surfaces unchanged
- Legacy shell view model (`buildMarketingWorkspaceShellViewModel`) retained for tests; layout uses colleague VM only

## Tests

- `lib/peer-experience/marketing/colleague/__tests__/marketing-peer-colleague.test.ts`
- Updated routing tests for six sections and `/waiting`, `/results` hrefs

## Sprint 29B.1 polish (presentation)

- Customer content normalization (`normalize-customer-workspace-content.ts`)
- Done deduplication (`build-deduplicated-outcomes.ts`)
- Premium section UI (`features/marketing-workspace/colleague/ui/*`)
- Command Center–aligned CSS (`.mw-cc-*`)

- Command Center strip link refresh (compatibility only this sprint)
- Results channel integrations (GA4, ads, CRM)
- Full NL for all settings modals
- Reusable `PeerWorkspaceShell` for non-Marketing peers
