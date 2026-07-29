# Sprint 29C — Peergent v17 customer experience

Approved reference: `docs/reference/peergent-prototype-v17.html`.

## Preserved

- **HQ** at `/hq` — unchanged visual shell; **Open briefing** → `/home` (Command Center).
- All Marketing Peer capabilities (campaigns, review, settings sub-routes, admin inspector).
- Legacy deep links: `/team/[peerId]/waiting`, `/done`, `/review`, `/performance`, `/knowledge`, etc.

## Customer shell

- `features/customer-v17/shell/V17CustomerShell.tsx` — rail (HQ, Command Center, org Peers), atmosphere, theme toggle.
- Scoped tokens: `features/customer-v17/styles/v17-customer.css`, `lib/design-system/v17-customer-tokens.ts`.
- Typography: Manrope + IBM Plex Mono via `app/layout.tsx` CSS variables.

## Command Center

- Route: **`/home`** (unchanged).
- UI: `features/customer-v17/command-center/V17CommandCenter.tsx`.
- View model: `lib/customer-v17/build-v17-command-center-view-model.ts` (working now → completed today → waiting → performance → weekly impact).
- Performance card click → **`/team/[peerId]/results`** (`v17PerformanceCardHref`).

## Peer workspace (four sections)

| Customer | Route |
|----------|--------|
| Vandaag / Today | `/team/[peerId]` |
| Werk / Work | `/team/[peerId]/work` |
| Resultaten / Results | `/team/[peerId]/results` |
| Instellingen / Settings | `/team/[peerId]/settings` |

Today composes waiting, completed today, and next from Sprint 29B view models (`V17TodayView`).

Legacy section ids (`working_on`, `waiting_for_me`, `done`) remain for compatibility in `resolveActiveMarketingPeerSection`.

## Product rule (long-term)

Customers see a **small number of broad, capable Peers**. Internal agents and tools do not become separate customer-facing Peers.

## Sprint 29C.1 — presenter rebuild

- Dedicated v17 view models under `lib/customer-v17/` (Today, Work, Results, Settings, Command Center, peer shell briefing).
- Presenters under `features/customer-v17/` — no legacy `DecisionCardList`, `ProjectsTab`, or `PerformanceTab` on customer index surfaces.
- Canonical sidebar Peers: `selectCanonicalCustomerPeers()` (one active peer per primary role; excludes test/inactive).
- Command Center: line rows, max 2 attention cards, weekly impact only when ≥2 real metrics.
- Peer shell: identity + briefing + tabs; assign/pause in overflow menu (no top action bar).

- Direct approve from Command Center without review (links follow existing `HomeNeedsYouItem.href` semantics).
- Full light-theme polish pass on Work/Results row styling.
- Connector-backed Results metrics (GA4, Ads, CRM).

## Sprint 29C.3 — grounded impact + campaign/review presenters

- **Deze week onderbouwd:** `buildGroundedWeeklyMetrics()` — measured internal metrics only; 4-column stat grid; no time-saved/revenue.
- **Campaign detail:** unified `V17CampaignDetailView` for wizard and legacy projects via expanded `buildV17CampaignDetailViewModel`.
- **Review:** `V17CampaignReviewView` + `V17StructuredReviewContent` with localized section labels; preserves `CampaignReviewActions`.

- **Canonical team:** `CUSTOMER_PEER_RAIL_ORDER`, Operations → Planning, dedupe by role bucket, rail labels via `canonicalCustomerPeerLabel()`, compact dark/light theme (no Executive/Mission/System panel).
- **Command Center:** fixed section order with empty states for Nu bezig / Vandaag afgerond; workforce fallbacks; attention context without triple peer name; performance “Nog geen score” + taken deze week.
- **Peer briefing / Today:** sanitized headlines, Vandaag gedaan + Hierna mapping with fallbacks.
- **Work:** grouped Actief/Gepland/Afgerond, NL status tags, v17 create-campaign modal (`presentation="v17"`).
- **Campaign detail:** `V17CampaignDetailView` + VM (non-wizard projects); wizard path still `CustomerCampaignExperience`.
- **Results:** NL labels, no unmeasured time-saved; summary + unavailable state.
- **Settings:** index rows → `?section=`; knowledge detail via `V17KnowledgeSettingsView`.
- **Tests:** canonical Sales dedupe, attention copy, CC completed fallback (`888` tests).
