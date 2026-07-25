<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Peergent — Agent & Engineering Rules

## Planning is complete. Build Peergent 2.0.

### Highest authority (locked)

These founding documents override **all existing UI, code, and legacy patterns** when they conflict:

1. **`docs/PEERGENT_EXPERIENCE_CONSTITUTION.md`** — emotional operating principles
2. **`docs/PEERGENT_PRODUCT_BIBLE.md`** — psychology, moments, 100 immutable laws

Read both before any feature, design, or interaction work.

**Pre-implementation gate** — see Step 1 in Feature workflow below.

**Founding docs are complete.** Do not create new philosophy, process, or workflow documents. Improve the Bible, Constitution, or Design System only when real product experience proves they should change.

### Feature workflow (required for every new feature)

Do not write code until Steps 1–3 are reviewed and Step 4 is approved.

**Step 1 — Product Review**

- What user problem are we solving?
- Why does this feature exist?
- Which Product Bible principles does it reinforce?
- Which Experience Constitution principles does it reinforce?
- Does it make Peergent feel more premium?
- Does it strengthen the feeling of an AI Workforce Operating System?

**Step 2 — UX Proposal**

- Complete user flow: what the user sees, what they feel, why every interaction exists, where signature moments are.
- Challenge the proposal and suggest improvements before implementing.

**Step 3 — Design Review**

- Check: visual consistency, interaction consistency, motion consistency, accessibility, premium feel, simplicity, performance.
- If something feels generic, redesign before code.

**Step 4 — Implementation**

- Production-quality only. No placeholders. No "good enough."
- Every screen intentional; every interaction justified; every animation purposeful.
- Craftsmanship over speed.

If a proposal violates the founding documents, **stop** and propose a better alternative.

### Also immutable

- Product Blueprint (Peergent 2.0)
- Brand & Experience Blueprint
- Product Design System v1.0

**Do not redesign UX, IA, workflows, or brand** to solve engineering problems — except where legacy UI conflicts with the Constitution or Product Bible; then the founding documents win.

## Implementation guide

Read **`docs/IMPLEMENTATION.md`** before any feature work. It defines phases, architecture, testing, and what to preserve vs replace.

Supporting docs:

- `docs/architecture/OVERVIEW.md` — layers, state, data flow
- `docs/design-system/V1.md` — token quick reference
- `docs/blueprints/README.md` — blueprint authority

Legacy docs (`PEERGENT_DESIGN_BIBLE.md`, `DESIGN_TOKENS.md`, root `PEERGENT_PRODUCT_BLUEPRINT.md`) are **pre-2.0**. When they conflict with 2.0 blueprints, **2.0 wins**.

## Product principles (never violate)

1. AI colleagues feel alive.
2. Users arrive at work — Home is the default after login.
3. One primary action per screen state.
4. Context before action.
5. **Review bar never disappears** during review.
6. Work stays with the work.
7. Calm over noise.
8. Typography before containers.
9. Delegation over automation.
10. One thing matters at a time.

## Code conventions

- **Design system components:** `Pg*` prefix in `components/design-system/`
- **Tokens:** `--pg-color-*`, `--pg-space-*` from `app/globals.css` / `lib/design-system/tokens.ts`
- **No hardcoded hex** in new components
- **Preserve:** `lib/marketing-workspace/`, `lib/marketing-intelligence/`, `lib/ai-runtime/`, Supabase repos
- **Replace surfaces:** legacy `/peers`, `/dashboard`, `/knowledge`, panel stack, slide-over review paths

## Golden rule

When uncertain: re-read the blueprints. Implement with engineering excellence. Do not redesign.

## Current phase

**Phase 0:** Complete — `PgReviewBar` + `PgInspector`; review dead-end fixed. See `docs/architecture/PHASE_0.md`.

**Phase 1:** Complete — `/home` morning command center. See `docs/architecture/PHASE_1.md`.

**Phase 2:** Complete — `/inbox`, `PgAppShell`, `PgNav`, `PgButton`. See `docs/IMPLEMENTATION.md`.

**Phase 3:** Complete — Peer Studio at `/team/[peerId]` (Marketing). See `docs/IMPLEMENTATION.md`.

**Next:** Phase 4+ per `docs/IMPLEMENTATION.md`.

See `docs/IMPLEMENTATION.md` for full phase plan.
