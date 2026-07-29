# Peergent — Product architecture & roadmap (reference)

Documentation for **customer journey**, **colleague workspace IA**, **presence & language**, and **long-term product vision**. Engineering implementation still follows [../IMPLEMENTATION.md](../IMPLEMENTATION.md). Emotional and product law still follow the founding documents (highest authority).

## Founding documents (do not replace)

| Document | Path |
|----------|------|
| Experience Constitution | [../PEERGENT_EXPERIENCE_CONSTITUTION.md](../PEERGENT_EXPERIENCE_CONSTITUTION.md) |
| Product Bible | [../PEERGENT_PRODUCT_BIBLE.md](../PEERGENT_PRODUCT_BIBLE.md) |
| Design System v1 (engineering summary) | [../design-system/V1.md](../design-system/V1.md) |
| Blueprints index | [../blueprints/README.md](../blueprints/README.md) |

## Sprint 29A — architecture & roadmap

| Document | Purpose |
|----------|---------|
| **[PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md](./PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md)** | HQ, Command Center, six-question Peer workspace, journeys, naming (EN/NL), power-user model, admin separation, cross-peer skeleton |
| **[PEERGENT_MASTER_ROADMAP.md](./PEERGENT_MASTER_ROADMAP.md)** | Phases A–H (colleague UX → creative engine → integrations → closed loop → digital workforce), dependencies, completion criteria |

## Sprint 29A.1 — colleague behavior foundation

| Document | Purpose |
|----------|---------|
| **[PEERGENT_PRESENCE_MODEL.md](./PEERGENT_PRESENCE_MODEL.md)** | Six customer-facing presence states, EN/NL labels, priority, surfaces, admin mapping |
| **[PEERGENT_COLLEAGUE_LANGUAGE.md](./PEERGENT_COLLEAGUE_LANGUAGE.md)** | Voice, tone, patterns, forbidden software language, domain examples (EN/NL) |
| **[PEERGENT_INTERACTION_PRINCIPLES.md](./PEERGENT_INTERACTION_PRINCIPLES.md)** | Interaction rules, interruption levels, empty states, never-do list |

## Sprint 29B — Marketing Peer workspace (implemented)

Engineering note: [../architecture/SPRINT_29B_MARKETING_PEER_WORKSPACE.md](../architecture/SPRINT_29B_MARKETING_PEER_WORKSPACE.md) — colleague shell at `/team/[peerId]` (superseded for customer nav by Sprint 29C).

## Sprint 29C — v17 customer experience (implemented)

Engineering note: [../architecture/SPRINT_29C_PEERGENT_V17_CUSTOMER_EXPERIENCE.md](../architecture/SPRINT_29C_PEERGENT_V17_CUSTOMER_EXPERIENCE.md) — HQ preserved; Command Center at `/home`; four-section Peer workspace (Today, Work, Results, Settings); v17 shell and tokens.

## Related audits (engineering)

- [../architecture/ADMIN_CUSTOMER_AUDIT.md](../architecture/ADMIN_CUSTOMER_AUDIT.md) — customer vs admin presenters
- [../architecture/CAMPAIGN_EXPERIENCE_AUDIT.md](../architecture/CAMPAIGN_EXPERIENCE_AUDIT.md) — marketing campaign surfaces (pre–colleague IA)

## When to read what

| Task | Read |
|------|------|
| Designing or changing customer UI | Architecture + **Presence** + **Language** + **Interaction Principles** + Constitution + Product Bible + Design System v1 |
| Writing customer copy | **Colleague Language** + Presence labels |
| Notifications / badges / empty states | **Interaction Principles** + Presence priority |
| Planning sprints beyond Marketing Peer | Master Roadmap |
| Implementing features | IMPLEMENTATION.md — do not contradict colleague IA without product review |
