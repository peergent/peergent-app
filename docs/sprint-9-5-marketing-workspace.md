# Sprint 9.5 — Marketing Workspace

First user-facing workspace for the Marketing Peer — product experience, not backend capability.

## Purpose

Makes the Marketing Peer feel like a real digital employee by visualizing the full capability chain and guiding the user through next steps.

## Route

`/peers/[id]/marketing`

- Marketing peers only (role gate)
- Linked from standard peer workspace header ("Marketing workspace" button)
- Standard workspace remains at `/peers/[id]`

## What the workspace shows

| Section | Source |
|---------|--------|
| Knowledge completeness | GET `/api/marketing-intelligence/understanding` |
| Marketing understanding | Understanding API + profile counts |
| Marketing strategy | Session state + POST `/strategy` |
| Marketing plan | Session state + POST `/plan` |
| Content calendar | From plan |
| Draft content | Session state + POST `/content-draft` |
| Warnings & gaps | Aggregated from APIs + understanding |
| Recommended next actions | Rule-based from workspace state |
| Approval actions | Client-side draft status (draft → ready_for_review / approved / rejected) |

## User questions answered

- **What does the peer know?** — Understanding panel + completeness score
- **What is it working on?** — Current focus card + thinking state during generation
- **What is missing?** — Warnings panel + gap badges
- **What does it recommend?** — Recommended next actions
- **What requires approval?** — Draft review with approve / reject / ready for review

## Client modules

| Module | Path |
|--------|------|
| API client | `lib/marketing-workspace/api.ts` |
| Session storage | `lib/marketing-workspace/storage.ts` |
| Recommendations | `lib/marketing-workspace/recommendations.ts` |
| Main view | `components/marketing-workspace/MarketingWorkspaceView.tsx` |

Strategy, plan, and drafts persist in `sessionStorage` per peer until backend persistence is added.

## Guardrails

- No publishing
- No external integrations
- No backend changes
- Reuses existing marketing APIs
- Draft status never auto-approves

## Capability chain (UI)

```
Understanding → Strategy → Plan → Content Calendar → Draft → Review
```

See also: [Sprint 9.4 — Marketing Content Creator](./sprint-9-4-marketing-content-creator.md)
