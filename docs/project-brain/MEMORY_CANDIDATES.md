# Project Brain — Memory Candidates (Sprint 6)

Capabilities may emit memory candidates. Sprint 6 persists them without auto-promotion to trusted memory.

## States

`candidate` → `awaiting_review` → `approved` | `rejected` | `expired` | `superseded`

## Fields

- scope, provenance, confidence, reason, sensitivity
- source run/output references
- review actor/time
- expiration/review date

## Repository

`BrainMemoryCandidateRepository` — store, list, updateReviewState.

No full memory-learning engine in Sprint 6.
