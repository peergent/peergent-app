# Approval

Brain separates **thinking from doing**.

```
Reasoning → Proposal → Policy → Approval → Execution → Audit
```

## Execution modes

Aligned with Campaign workspace:

| Mode | Behavior |
|------|----------|
| `manual` | Always require approval for gated capabilities |
| `semi_automatic` | Auto for low-risk; approval before publish |
| `fully_automatic` | Auto when Working Agreement permits |

## Working Agreement integration

`evaluateBrainPolicy()` accepts:

- `executionMode` — campaign execution mode
- `approvalPolicy` — from Working Agreement / Marketing autonomy (`prepare_only`, `approval_required`, `fully_automatic`)
- `capabilityApprovalRequirement` — from capability registry (`none`, `before_action`, `before_publish`)

Returns `allow`, `require_approval`, or `block`.

Sprint 1: **policy contract only** — no execution engine.
