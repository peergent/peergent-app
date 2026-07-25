# Marketing Workspace — Pilot acceptance checklist

Run on the **Peergent development tenant** with `npm run dev`. Do **not** publish externally or spend ad budget during this run.

| Step | Action | Pass criteria | Done |
|------|--------|---------------|------|
| 1 | Open HQ (`/home` or product HQ route) | Loads without error | ☐ |
| 2 | Open Marketing workspace `/team/[peerId]` | Hero, tabs, `mw-*` shell | ☐ |
| 3 | Verify hero status and objective | Live line, decision pill, objective card | ☐ |
| 4 | Responsibilities tab — enable or confirm one responsibility | Toggle persists after refresh | ☐ |
| 5 | Approve plan or assign work to create a project | Project appears on Projects tab | ☐ |
| 6 | Open project detail | WorkUnits visible on detail page | ☐ |
| 7 | Start/advance a WorkUnit (delegation or existing controls) | Status/progress changes | ☐ |
| 8 | Hero live feed | New activity line or updated timestamp | ☐ |
| 9 | Generate a content draft (Assign / Create post) | Draft in Content tab | ☐ |
| 10 | Open content detail | Preview + copy, `mw-*` layout | ☐ |
| 11 | Send for decision / ready for review | Draft status pending | ☐ |
| 12 | Hero decision count | Increments vs prior | ☐ |
| 13 | Overview “Needs your decision” | Same item as Review | ☐ |
| 14 | Approve in Review or content detail | Mutation succeeds | ☐ |
| 15 | Decision removed from Review queue | Count decreases | ☐ |
| 16 | Linked WorkUnit | Moves past review block | ☐ |
| 17 | Project progress | Updates on project detail | ☐ |
| 18 | Activity timeline | Approval event logged | ☐ |
| 19 | Content status | Shows approved / next state | ☐ |
| 20 | Command Center | Marketing summary consistent | ☐ |
| 21 | HQ Marketing service state | No stale “waiting” if resolved | ☐ |
| 22 | Settings — change one autonomy rule | Persists after refresh | ☐ |
| 23 | Trigger action (e.g. posting toggle) | Decision required or not per policy | ☐ |
| 24 | Revert to pilot safe mode | See INTERNAL_PILOT.md | ☐ |
| 25 | Return to HQ | Summaries still consistent | ☐ |

## Automated pre-check (CI)

```bash
npx vitest run lib/peer-experience/marketing/__tests__/marketing-pilot-integration.test.ts
npm run build
```

## Consistency watchlist

- Duplicate decisions in Review vs Overview
- Hero count ≠ full approval queue length
- Duplicate activity entries on single approve
- Full page reload on tab change
- Legacy `mp-*` flash on detail routes
