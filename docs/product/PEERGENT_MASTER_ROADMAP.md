# Peergent Master Roadmap

**Status:** Long-term product vision (Sprint 29A)  
**Authority:** Subordinate to [Experience Constitution](../PEERGENT_EXPERIENCE_CONSTITUTION.md), [Product Bible](../PEERGENT_PRODUCT_BIBLE.md), and [Colleague Experience Architecture](./PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md).  
**Note:** Engineering phase numbers in [IMPLEMENTATION.md](../IMPLEMENTATION.md) (Phase 0–4+) remain the **delivery** track for the app shell; this document is the **product** horizon.

---

## Overview

Marketing Peer today is **technically strong** (onboarding, planning, execution, review, revisions, collaboration, continuation) but **not product-complete**. Workspace IA still reflects pre-colleague dashboards in places.

This roadmap defines phases **A–H** through a full **Digital Workforce** and **closed marketing loop**.

```text
A Colleague Experience ──► B Design System ──► C Company/Brand Intelligence
         │                                              │
         └──────────────────► D Marketing Intelligence Layers
                                        │
                    E Creative Engine ◄─┘
                                        │
                              F Integration Hub
                                        │
                              G Closed Marketing Loop
                                        │
                              H Digital Workforce (multi-peer)
```

---

## Phase A — Colleague Experience

**Objective:** Every surface feels like colleagues at work, not software to manage.

### Scope

- HQ (preserve strengths; team pulse; needs you; open Peer)  
- Command Center (needs attention · working now · recently completed · up next)  
- Six-question Peer workspaces (Working on · Waiting for me · Done · Work · Results · Settings)  
- Global Inbox aligned with Waiting for me  
- Done / delivered value narrative  
- Customer vs admin presenter separation (extend beyond campaign inspector)  
- EN + NL for all customer strings (extend localization foundation)  
- Progressive disclosure; power depth without dual product  

### Dependencies

- Existing review/collaboration VMs and workspace persistence (no new truth)  
- Sprint 28B-style presence components generalized to Peer shell  

### Completion criteria

- Delegation-first user can: login → see if anything needed → approve → leave, ≤3 interactions  
- No customer-facing work unit / artifact / runtime language in default paths  
- Command Center shows team completed / in progress / attention  
- Peer nav ≤6 primary sections; legacy tabs migrated to Settings or disclosure  
- Admin inspector unchanged in capability  

### Risks

- Re-navigating without breaking deep links — migration map required in 29B  
- Inbox duplication if HQ, CC, and Peer Waiting for me diverge — single queue VM, multiple filters  

### Recommended ordering (within A)

1. Peer workspace shell + Working on / Waiting for me / Done  
2. Command Center team operating strips  
3. Work + engagement detail alignment  
4. Settings consolidation  
5. Results shell (placeholder metrics OK if honest)  
6. HQ ↔ CC ↔ Inbox link consistency  

---

## Phase B — Peergent Product Design System

**Objective:** Pixel-consistent, premium dark UI (Linear / Stripe / Raycast class) across HQ, CC, Peers.

### Scope

- Token completion in CSS (`--pg-*`) vs Design System v1  
- `Pg*` component library: buttons, presence, inbox rows, review bar, empty states, motion  
- Typography hierarchy; spacing; elevation ladder (no glass everywhere)  
- Accessibility: focus, contrast, reduced motion, touch targets  
- Documentation in design-system/V1 + Storybook or equivalent (future)  

### Dependencies

- Phase A IA stable enough to avoid rework  

### Completion criteria

- No new customer surfaces use ad-hoc `mw-*` one-offs without token mapping  
- Review bar never unmounts (Constitution)  
- WCAG AA on primary flows  

---

## Phase C — Company and Brand Intelligence

**Objective:** One company memory Peers share — accurate, approved, auditable.

### Scope

- **Company Brain** — business facts, goals, constraints  
- **Brand Brain** — voice, visual identity, claims, rules, historic campaigns  
- Product / audience / competitor knowledge  
- Memory with provenance; customer-safe vs internal fields  
- Feeds all Peers (Phase H)  

### Dependencies

- Persistence and RAG patterns (existing brains work — extend product surfaces)  

### Completion criteria

- Marketing (and later Peers) cite approved brand rules in outputs  
- Customer can edit brand/knowledge in Settings without seeing graph internals  
- Admin can audit sources  

### Marketing Peer blocker

**Brand Brain productization** is required before Marketing Peer is “complete” (see § Marketing Peer completion).

---

## Phase D — Marketing Intelligence Layers

**Objective:** Structured marketing cognition — not one monolithic prompt.

### Scope (conceptual layers)

- Intent  
- Planning  
- Reasoning  
- Marketing Strategy  
- Creative Director  
- Performance Marketer  
- QA  
- Reflection  
- Learning  
- Confidence / quality scoring  

### Dependencies

- C for grounded brand/company context  
- Existing planner/executor architecture (preserve; enhance layers in brain/runtime per IMPLEMENTATION)  

### Completion criteria

- Traceable layer outputs in admin; customer sees outcomes only  
- Measurable quality improvement vs baseline  
- Learning loop feeds suggestions (ties to Phase G)  

---

## Phase E — Pixel-perfect Customer Creative Engine

**Objective:** Creative output indistinguishable from an in-house design team — not generic AI slop.

### Scope

- Brandbook ingestion (logos, colors, fonts, spacing, photography style)  
- Template & layout engine per channel  
- Product × persona × angle × hook × CTA × format mapping  
- Variant engine; render engine  
- Automated asset QA (brand compliance)  
- Deliverables: ads, social, carousels, banners, landing visuals, email visuals; motion/video later  
- **Exact approved version publishing** (handoff to Phase G)  

### Dependencies

- C Brand Brain mature  
- B design system for preview surfaces  
- D creative director layer stable  

### Completion criteria

- Pilot customers accept assets with ≤ minor revision rate (define in pilot checklist)  
- QA blocks off-brand output before customer review  
- Version tied to render artifacts in existing review flow  

### Reference ambition

Match or exceed premium creative ops experiences (e.g. high-end creative automation benchmarks). Customer says: “Our team could have made this.”

---

## Phase F — Integration Hub

**Objective:** Hundreds of connectors; one OAuth/capability/audit model.

### Scope

- Standardize: OAuth, credentials, scopes, read/write actions, retries, rate limits, webhooks, errors, tool availability audit  
- Initial wave: LinkedIn, Meta, Instagram, Google Ads, GA4, GSC, TikTok, YouTube, WordPress, Shopify, HubSpot, Salesforce, Mailchimp, Klaviyo, Gmail, Slack, Exact, Stripe, etc.  
- n8n / Make / Zapier as optional bridges — not primary UX  
- Customer: Connections in Settings; admin: integration diagnostics  

### Dependencies

- Security architecture (Constitution / constitution docs)  
- Phase G needs publish/read metrics adapters  

### Completion criteria

- Connector SDK pattern documented; 5+ production connectors  
- Customer never sees API keys in plain text; revoke works  

---

## Phase G — Closed Marketing Loop

**Objective:** create → approve → schedule → publish → measure → learn → optimize.

### Scope

- Publish adapters (from approved artifact versions only)  
- Scheduling  
- Measurement ingestion (via F)  
- Analysis & recommendations (budget, creative tests)  
- Regeneration with learning (D reflection)  
- Self-correction within policy bounds  

### Dependencies

- E render + version truth  
- F integrations  
- A customer readiness models (already started)  
- Approval policy unchanged unless product explicitly extends  

### Completion criteria

- End-to-end pilot: campaign → approved asset → published → metric visible in Results  
- No publish without approved version  
- Learning suggests next actions in Command Center / Results — not spam  

---

## Phase H — Digital Workforce

**Objective:** Multiple Peers coordinate with shared brain, inbox, approvals, audit.

### Scope

- Sales, Support, Planner, Finance, HR, Administration Peers on **same workspace skeleton (Phase A)**  
- Cross-Peer coordination examples:  
  - Sales → Marketing nurture  
  - Finance → budget caps on campaigns  
  - Planner → deadlines  
  - Support → content insights  
- Shared: Company Brain, Integration Hub, inbox, permissions, activity narrative  

### Dependencies

- A architecture proven on Marketing  
- C shared memory  
- F integrations per domain  

### Completion criteria

- Two Peers active in production with cross-surface attention on HQ/CC  
- No duplicate approval stores  
- Peer coordination rules auditable (admin)  

---

## Marketing Peer — when is it “truly complete”?

Marketing Peer is **not** complete after Phase A (colleague UX) alone.

**Minimum bar for “Marketing Peer 1.0” product complete:**

| Area | Required phase | Gate |
|------|----------------|------|
| Colleague UX | A | Six-question workspace shipped |
| Premium UI | B | Design system applied |
| Brand-grounded output | C | Brand Brain in Settings + enforced in generation |
| Layered intelligence | D | QA + reflection in loop |
| On-brand creative | E | Pixel-perfect engine + asset QA |
| Publish & measure | F + G | At least core channels + metrics in Results |
| Learning | D + G | Optimization suggestions from real data |

Until then, position honestly in product: **“Marketing colleague — preparation & review”** expanding to **“full loop”** as phases ship.

---

## Recommended global sequencing

| Order | Phase | Rationale |
|-------|-------|-----------|
| 1 | **A** | Unblocks adoption; uses existing VMs |
| 2 | **B** (parallel tail of A) | Premium trust |
| 3 | **C** | Blocks quality creative |
| 4 | **D** | Improves strategy/creative quality |
| 5 | **E** | Differentiator vs AI tools |
| 6 | **F** | Enables G |
| 7 | **G** | Revenue / ROI story |
| 8 | **H** | Platform moat |

---

## Risks (program level)

| Risk | Mitigation |
|------|------------|
| Dashboard relapse | IA doc + PR checklist; Constitution gate |
| Integration sprawl | Hub SDK before scaling connectors |
| Creative quality | Brand Brain + QA gate before publish |
| Two truths for review | Single decision store; presenters only |
| Scope creep in A | Ship shell + 3 sections before Results depth |

---

## References

- [Colleague Experience Architecture](./PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md)  
- [Product README](./README.md)  
- [IMPLEMENTATION.md](../IMPLEMENTATION.md)  
- [Marketing pilot checklist](../marketing/PILOT_ACCEPTANCE_CHECKLIST.md)  
