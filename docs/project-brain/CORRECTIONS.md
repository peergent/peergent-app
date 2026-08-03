# Project Brain — Corrections (Sprint 6)

Customer corrections are organization-scoped overrides that outrank website extraction, integration inference, and Brain inference.

## Operations

- create, edit, replace, remove
- approve, reject_inference
- supersede (history retained, not deleted)

## Application

`CompanyContextAssembler` loads active corrections and applies them in `buildCompanySnapshot()` via `applyCorrections()`. Corrections alter the **assembled canonical snapshot**, not raw source records.

## Source priority

Confirmed customer correction → `customer_confirmed` source with high confidence.

## Invalidation

Each correction records affected dependencies. On apply, `BrainInvalidationService.executeForCorrection()` marks downstream capability outputs stale.

Repository: `CustomerCorrectionRepository` in `lib/brain/persistence/contracts.ts`.
