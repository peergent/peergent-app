# Roadmap

## Sprint 1 (complete)

- Shared `lib/brain/` package
- Environment resolution (live / demo / test)
- BrainRunContext, BrainSnapshot
- Capability registry + workflow mapping
- Structured output model + provenance
- Run lifecycle types
- Policy, execution pipeline contracts
- Token strategy, cache, memory design
- Audit + admin read models
- Demo provider (deterministic, no AI)
- Presentation adapter → CampaignEvidenceSection
- Office migration shims
- Tests and documentation

**Not in Sprint 1:** AI providers, scraping, generation, admin UI, run executor.

## Sprint 2 (recommended)

1. **Context assembly** — wire Context Engine + business-brain + brand-brain into `BrainSnapshot` builder
2. **Run executor** — queue → gather context → execute capability → audit
3. **Wire presentation** — connect `presentBrainOutputForCampaign()` to campaign workflow evidence builder (without changing Vision v13 layout)
4. **Persistent cache** — backing store with org-scoped keys
5. **First live capability** — e.g. `company_understanding` reading business-brain only (no LLM)
6. **Admin API** — expose BrainHealth / BrainRunSummary read models

## Sprint 3+

- LLM provider adapter (behind `BrainCapabilityProvider`)
- Memory persistence and review workflow
- Cross-peer capability sharing
- Cost and token telemetry in admin

## Principles (unchanged)

- One Brain runtime for all Peers
- Customers see outcomes, not infrastructure
- Upstream systems stay authoritative
- Vision v13 wins for customer UI
