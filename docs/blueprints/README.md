# Peergent 2.0 — Immutable Blueprints

The planning and design phase is **complete**. These documents define the product. Do not redesign UX, IA, workflows, or brand without explicit product approval.

## Canonical sources

### Highest authority (locked)

| Document | Location | Scope |
|----------|----------|--------|
| **Experience Constitution** | `docs/PEERGENT_EXPERIENCE_CONSTITUTION.md` | Emotional operating principles — immutable |
| **Product Bible** | `docs/PEERGENT_PRODUCT_BIBLE.md` | Psychology, signature moments, 100 laws — single source of truth for feel |

These override existing UI and code when they conflict. Every feature must be evaluated against them before implementation.

### Product & design authority

| Document | Location | Scope |
|----------|----------|--------|
| **Product Blueprint** | Conversation-approved (Sprint 11 → Peergent 2.0) | IA, screens, flows, migration phases |
| **Brand & Experience Blueprint** | Conversation-approved | Mission, Maya, motion philosophy, writing, rituals |
| **Product Design System v1.0** | Conversation-approved | Tokens, components, patterns, handoff |

Legacy repo docs (`PEERGENT_PRODUCT_BLUEPRINT.md`, `PEERGENT_DESIGN_BIBLE.md`, `DESIGN_TOKENS.md`) describe **pre-2.0** surfaces. When they conflict with 2.0 blueprints, **2.0 wins**.

## Immutable product principles

1. Home is the default destination after login.
2. Four top-level nav items: **Home · Inbox · Team · Company**.
3. Peer Studio is entered contextually — not a nav item.
4. One primary action per screen state.
5. Context before action.
6. **Review bar never disappears** during review states.
7. Work stays with the work.
8. AI colleagues feel present — not chat widgets.
9. Human language only — no workflow enums in UI.
10. No empty, fake, or "Soon" surfaces in production.
11. NL + EN from foundation.
12. Typography before containers. Calm over noise.

## Implementation entry point

All engineering work follows **[../IMPLEMENTATION.md](../IMPLEMENTATION.md)**.
