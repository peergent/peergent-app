# Peergent 2.0 — Architecture Overview

## System layers

```
┌─────────────────────────────────────────────────────────────┐
│  app/              Routes, layouts, API route handlers       │
├─────────────────────────────────────────────────────────────┤
│  features/         Product features (home, inbox, studio…) │
├─────────────────────────────────────────────────────────────┤
│  components/       Shared UI + design-system components    │
├─────────────────────────────────────────────────────────────┤
│  hooks/            React hooks (UI + data orchestration)   │
├─────────────────────────────────────────────────────────────┤
│  lib/              Domain logic, services, AI, persistence   │
│    peers/          Peer identity, presence, capabilities     │
│    workstreams/    Campaign / work ownership                 │
│    inbox/          Attention queue model                     │
│    company/        Business profile / confidence             │
│    marketing-*/    Marketing intelligence (preserve)         │
│    ai-runtime/     LLM execution (preserve)                  │
└─────────────────────────────────────────────────────────────┘
```

## Separation of concerns

| Layer | Responsibility | Must NOT contain |
|-------|----------------|------------------|
| **app/** | Routing, SSR, API boundaries | Business rules, view-model mapping |
| **features/** | Screen composition, feature hooks | Raw API calls, LLM prompts |
| **components/design-system/** | Pg* primitives per Design System v1.0 | Product copy, workflow logic |
| **lib/** | Business logic, persistence, AI | React components |
| **lib/peer-experience/** → **features/*/presentation/** | View models, copy, presentation mapping | Storage, generation |

## AI colleague model

Peers are first-class entities — not chat wrappers.

```
Peer
├── Identity      (id, name, role, department, accent)
├── Presence      (working | waiting | idle | blocked)
├── Memory        (session + persisted context references)
├── Capabilities  (peer-type module from context-engine)
├── Workstreams   (owned campaigns / jobs)
├── Status        (derived from workstreams + inbox)
├── Conversation  (guidance channel — not sole interface)
└── ReviewCycle   (draft → review → approve → publish)
```

Future peers plug into the same `Peer` + `PeerStudio` shell. Marketing (Maya) is the first full implementation.

## State categories

Keep state local unless cross-surface coordination requires otherwise.

| Category | Where | Examples |
|----------|-------|----------|
| **UI state** | Component / feature hook | Inspector open, sheet expanded |
| **Server state** | lib + React cache | Peers, drafts, company profile |
| **Navigation state** | URL + layout | `/home`, `/team/[id]`, deep links |
| **Session state** | Auth provider | User, org, locale |
| **Review state** | Studio feature hook | Active draft, review bar mounted |
| **Workstream state** | lib/workstreams | Campaign step, progress rail |
| **AI state** | lib/ai-runtime + streaming | Generation in flight |

Document why each piece of shared state exists in the feature README.

## Data flow (review — critical path)

```
lib/marketing-workspace/     Workflow + persistence (preserve)
        ↓
lib/inbox/                   Attention items (new)
        ↓
features/studio/presentation View models + Maya copy
        ↓
features/studio/             PeerStudio layout + ReviewBar (always mounted in review)
        ↓
app/team/[peerId]/           Route
```

**Rule:** Opening plan inspector must not unmount ReviewBar.

## Preserved systems (do not rewrite)

- `lib/marketing-intelligence/` — generation, parsing, types
- `lib/marketing-workspace/` — workflow, storage, publication, recommendations
- `lib/ai-runtime/` — LLM providers
- `lib/context-engine/` — peer type modules
- Supabase repositories — business-brain, company-dna, peers

## Replaced surfaces (2.0)

| Legacy | Replacement |
|--------|-------------|
| `/peers`, `/dashboard`, `/knowledge` | `/home`, `/inbox`, `/team`, `/company` |
| `MarketingWorkspaceView` panel stack | `PeerStudio` feature |
| `Sidebar` legacy nav | 2.0 shell nav |
| `DetailSlideOver` for review context | `Inspector` + persistent `ReviewBar` |
| Demo Command Center | Real-data `Home` |

## Performance targets

| Interaction | Target |
|-------------|--------|
| Route transition | < 200ms perceived |
| Home narrative | < 1s with skeleton |
| Studio open | < 300ms shell; stream content |
| Inbox list (100 items) | Virtualized render |
| Inspector open | No full workspace remount |

## Accessibility baseline

Design System v1.0 §16 — keyboard, focus rings, `aria-live`, reduced motion, 44px touch targets. Non-negotiable for every new component.
