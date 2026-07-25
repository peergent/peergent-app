# Peergent 2.0 — Implementation Guide

**Status:** Engineering charter · Planning complete · Build phase active  
**Authority:** Product Blueprint + Brand Blueprint + Design System v1.0 (immutable)

---

## Golden rule

When uncertain: **do not redesign**. Re-read the blueprints. Implement with engineering excellence.

If implementation is hard, solve the engineering problem — never change UX to make code easier.

---

## Acceptance test

Users open Peergent and immediately feel:

> *"My AI team already started working before I arrived."*

Everything else is implementation detail in service of that feeling.

---

## Engineering principles (priority order)

1. Maintainability  
2. Readability  
3. Consistency (Design System + patterns)  
4. Performance  
5. Accessibility  
6. Type safety  
7. Scalability  
8. Testability  
9. Predictability  
10. Developer experience  

---

## Target folder structure

Introduce incrementally. Do not big-bang move legacy code.

```
app/
  home/                    # /home
  inbox/                   # /inbox
  team/
    [peerId]/              # Peer Studio
  company/                 # /company/*
  onboarding/
  api/                     # Route handlers (preserve)

features/
  home/
  inbox/
  team/
  studio/                  # Peer Studio (Maya first)
  company/
  onboarding/
  shell/                   # App chrome, nav, command palette

components/
  design-system/           # Pg* components — Design System v1.0
  providers/               # Auth, locale, theme

hooks/                     # Shared hooks only

lib/
  design-system/           # Token exports, motion helpers
  peers/                   # Peer entity, presence, identity
  inbox/                   # Inbox item model + aggregation
  workstreams/             # Campaign progress
  company/                 # Profile confidence, gaps
  i18n/                    # Locale, copy keys
  marketing-workspace/     # PRESERVE — workflow
  marketing-intelligence/  # PRESERVE — generation
  ai-runtime/              # PRESERVE
  context-engine/          # PRESERVE

types/                     # Cross-cutting TS types (if not colocated)

config/                    # App config, feature flags
```

**No `misc/` folders.** Every directory has one responsibility documented in its README.

---

## Component naming

| Layer | Prefix | Example |
|-------|--------|---------|
| Design system | `Pg` | `PgButton`, `PgReviewBar`, `PgInboxItem` |
| Feature | Feature name | `HomePage`, `PeerStudio`, `MorningNarrative` |
| Legacy (migrate off) | — | `WorkspacePanel`, `DetailSlideOver` |

New UI uses `components/design-system/` only. Feature components compose `Pg*` primitives.

---

## Design tokens

Single source: **Product Design System v1.0**.

- CSS variables: `app/globals.css` (`--pg-*`)
- TypeScript reference: `lib/design-system/tokens.ts`
- Documentation: `docs/design-system/V1.md` (summary + link to full spec)

**No hardcoded hex in components.** No invented spacing. No new radii.

---

## Implementation phases

Each phase ships a **usable product**. Old routes redirect until removed.

### Phase 0 — Stop the bleeding (Week 1)

**User benefit:** Review never dead-ends.

| Item | Detail |
|------|--------|
| Scope | Sticky `PgReviewBar`; replace slide-over plan inspection with `PgInspector`; bar persists in all review paths |
| Preserve | `lib/marketing-workspace/*` workflow |
| Remove from review path | `DetailSlideOver` for plan during review |
| Acceptance | 100% paths: approve/reject visible while inspecting plan |
| Metric | Dead-end rate → 0 |

### Phase 1 — Home (Week 2–3) ✅ Complete

**User benefit:** Clear morning starting point.

| Item | Detail |
|------|--------|
| Scope | `/home`, Morning Narrative, Needs You, Suggested Start, Team Pulse, movement, context health, workstreams |
| Post-login | → `/home` when peers exist |
| Redirect | `/dashboard` → `/home` |
| Data | Real peers, marketing understanding API, session workspace snapshots — no demo Briefing |
| Doc | `docs/architecture/PHASE_1.md` |

### Phase 2 — Inbox (Week 3–4)

**User benefit:** Unified attention queue.

| Item | Detail |
|------|--------|
| Scope | `/inbox`, inbox item model, deep links to Studio with actions |
| Dependencies | Phase 0 review surface |
| Metric | Review completion rate baseline |

### Phase 3 — Peer Studio (Week 4–6)

**User benefit:** One room to work with Maya.

| Item | Detail |
|------|--------|
| Scope | Studio layout, presence header, context strip, work surface, peer panel, progress rail |
| Redirect | `/peers/[id]/marketing` → `/team/[id]` |
| Remove | Vertical panel stack, buried chat |
| Metric | Median time generated → approved |

### Phase 4 — Team (Week 6–7)

**User benefit:** Workforce feels alive.

| Item | Detail |
|------|--------|
| Scope | `/team`, real status, activity, pinned, search |
| Redirect | `/peers` → `/team` |
| Remove | Fake Pause, empty activity feed |
| Metric | Peer engagement sessions/week |

### Phase 5 — Company (Week 7–9)

**User benefit:** Business context without CRM dread.

| Item | Detail |
|------|--------|
| Scope | `/company`, confidence ring, guided gaps |
| Redirect | `/knowledge` → `/company` |
| Preserve | Knowledge API, repositories |
| Metric | Context completeness median |

### Phase 6 — i18n (Week 9–10)

**User benefit:** NL + EN product-ready.

| Item | Detail |
|------|--------|
| Scope | `lib/i18n/`, all 2.0 strings keyed, language in Company settings |
| Acceptance | Zero hardcoded customer-facing strings in 2.0 surfaces |
| Metric | Locale adoption |

### Phase 7 — Motion & visual polish (Week 10–12)

**User benefit:** Premium, alive feel.

| Item | Detail |
|------|--------|
| Scope | Motion tokens, presence pulse, approval/completion moments, container reduction |
| Acceptance | `prefers-reduced-motion` respected everywhere |

### Phase 8 — Hide unfinished (Ongoing)

Hide until real: Integrations, Analytics, generic peer workspace, demo badges, "Soon" nav, inert buttons.

---

## Testing strategy

### Pyramid

```
        E2E (Playwright)
       Critical flows only
      ─────────────────────
     Integration (features + lib)
    ─────────────────────────────
   Component (Pg* + key feature UI)
  ───────────────────────────────────
 Unit (lib pure functions, view models)
```

### Required test suites

| Suite | What |
|-------|------|
| **Unit** | Inbox prioritization, view-model mappers, Maya copy, confidence scoring |
| **Component** | `PgReviewBar` persistence, `PgInboxItem`, `PgButton` states (jsdom) |
| **Integration** | Home ← inbox items; Studio review + inspector + bar |
| **E2E** | Morning return → review → approve; inspect plan during review; inbox zero |
| **Regression** | `lib/marketing-workspace/*`, publication persistence |

### Critical workflow tests (must pass before each phase merge)

1. Review from Home → approve with plan inspector open  
2. Review from Inbox → send back → Maya retries  
3. Approve → publish preview → confirm live  
4. Mobile: approve from sticky review bar  
5. No mount/unmount of review bar when opening inspector  

### CI

- `npm test` — unit + integration  
- `npx tsc --noEmit`  
- `npm run lint`  
- E2E on PR for critical paths (when Playwright suite exists)  

---

## Documentation requirements

Each major system gets a README:

| Path | Documents |
|------|-----------|
| `features/studio/` | Layout states, review bar rules, inspector behavior |
| `lib/inbox/` | Item model, priority, deep-link contract |
| `lib/peers/` | Identity, presence derivation |
| `components/design-system/` | Component catalog + Storybook (when added) |
| `lib/i18n/` | Key conventions, NL/EN workflow |

---

## AI architecture rules

- Peers are entities in `lib/peers/` — not props on a chat component  
- Conversation guides; **work surface executes**  
- Presence derived from workstream + generation state  
- Memory references company profile + workstream history — not unbounded chat log  
- Maya copy lives in presentation layer — keyed for i18n  
- Future peers: same Studio shell, swap peer module + copy deck  

---

## Performance checklist

- [ ] Route-level loading.tsx skeletons match Design System loading patterns  
- [ ] Studio: lazy inspector content; no remount work surface on inspector toggle  
- [ ] Inbox: virtualize at 50+ items  
- [ ] Stream AI generation into work surface  
- [ ] Cache company profile + peer list with sensible stale times  

---

## Accessibility checklist (every PR)

- [ ] Keyboard path complete  
- [ ] Focus visible (`--pg-color-accent` ring)  
- [ ] `aria-live` on narrative and errors  
- [ ] Review bar `role="toolbar"` with labeled buttons  
- [ ] Reduced motion: no essential info in animation alone  
- [ ] Touch targets ≥ 44px  

---

## Hide immediately (Phase 0 cleanup)

Do not wait for full 2.0 — hide as soon as replacement exists or feature is fake:

- Sidebar: Conversations, Analytics, Integrations ("Soon")  
- Demo/provisional badges on production paths  
- Team Pause button (until real)  
- Empty Team activity column  
- Generic `/peers/[id]` non-marketing workspace  

---

## Do not carry forward (UI)

- Sprint 11 DetailsAccordion + slide-over as primary workflow  
- Briefing chapter scroll (`CommandCenter` demo assembly)  
- Knowledge form-grid as default Company experience  
- Activity feed as tall orphaned sidebar column  
- Chat buried below fold in workspace  
- "Deepen business context" → unpredictable destinations  

**Preserve underlying APIs and workflow logic.**

---

## First build task

**Phase 0:** Implement `PgReviewBar` + `PgInspector` in Peer Studio (or patched marketing workspace as interim shell) so plan inspection never removes approve/reject.

Then **Phase 1:** `/home` shell with real inbox-driven narrative.

---

## References

- [Architecture overview](./architecture/OVERVIEW.md)  
- [Blueprints index](./blueprints/README.md)  
- [Design System summary](./design-system/V1.md)  
- Legacy (deprecated for 2.0 UI): `PEERGENT_DESIGN_BIBLE.md`, `DESIGN_TOKENS.md`
