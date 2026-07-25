# Home — Executive Briefing

Morning arrival at `/home`.

## Architecture (Phase 1+)

| Layer | Location |
|-------|----------|
| Route entry | `features/home/HomePage.tsx` |
| Orchestrator | `features/home/ExecutiveBriefingHome.tsx` |
| Legacy presentation (Phase 1) | `features/home/handoff/HandoffHome.tsx` |
| Workforce UI (L2) | `components/workforce/*` |
| Data hook | `hooks/useHandoffHome.ts` |
| View model | `lib/home/build-home-view-model.ts` |
| Handoff adapter | `lib/home/adapt-handoff-state.ts` |

## Preview states

`?handoff=completed|urgent|calm|blocked|empty` and `?visual=reference` — isolated demo fixtures via `lib/home/handoff-demo.ts`.

## Migration

Phase 1 wires `ExecutiveBriefingHome` → `HandoffHome` (unchanged appearance). Later phases replace handoff presentation with `components/workforce/*` sections composed in the orchestrator.
