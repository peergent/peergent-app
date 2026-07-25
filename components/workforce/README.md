# Workforce UI (L2)

Cross-route workforce operating-system surfaces: briefing, attention queues, primary work, peer roster, and activity timelines.

**Not** role-specific deliverables (see `components/marketing-workspace/`, `components/peer-workspace/`).

## Consumers

- `/home` — Executive Briefing (`features/home/ExecutiveBriefingHome`)
- `/inbox` — attention queue (future)
- `/team` — AI peers roster (future)
- `/performance` — workforce summary (future)
- Peer studios — threshold states (future)

## Rules

- Accept domain view-model props from `lib/home`, `lib/inbox`, or `lib/workforce/presenters` (future).
- No Supabase calls, no routing logic beyond `Link`/`href` props passed in.
- Compose `Pg*` primitives from `components/design-system/`.
- Feature pages (`features/*`) orchestrate; this layer presents.

## Components

| Component | Purpose |
|-----------|---------|
| `PrimaryWorkCard` | Single primary work / agent action surface |
| `PeerWorkCard` | One peer status card |
| `PeerWorkGrid` | Grid of peer cards + optional footer link |
| `AttentionQueue` | Needs-attention list with optional view-all |
| `BriefingNarrative` | Morning briefing prose block |
| `WorkforceStatusLine` | “Team is working” status strip |
| `ActivityTimeline` | Recent activity / movement list |

Phase 1: scaffolds only. Visual implementation follows in later phases.
