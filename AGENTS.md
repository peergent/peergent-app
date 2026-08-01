<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Peergent — Agent & Engineering Rules

# Vision v13 Design Authority

Vision v13 is the **only** visual source of truth for every current and future Office, Command Center, and Peer interface.

The canonical location is:

`docs/reference/peergent-vision-v13/`

This directory contains:

- `mockup.html`
- `screenshots/`

These files together define the official Peergent visual language.

Whenever implementing UI, you **must** compare your implementation against **both**:

- `docs/reference/peergent-vision-v13/mockup.html`
- every screenshot inside `docs/reference/peergent-vision-v13/screenshots/`

Do not rely on memory. Do not approximate. Do not invent layouts. Always inspect the reference first.

When Vision v13 conflicts with legacy UI or pre-2.0 docs, Vision v13 wins for visual implementation on Office, Command Center, and Peer surfaces. Founding documents (Constitution, Product Bible) still win on product philosophy and emotional principles.

# Visual Implementation Rules

- Match visual hierarchy before writing code.
- Match spacing before matching colors.
- Match composition before matching components.
- Reuse existing components whenever possible.
- Never duplicate business logic for presentation-only changes.
- Prefer improving shared components over page-specific hacks.
- Never introduce fake analytics.
- Never fabricate customer data.
- Demo data may be fictional, but relationships between data must remain internally consistent.
- Customer-v17 is outside scope unless explicitly requested.
- Never commit or push unless explicitly instructed.

# Visual Verification

Implementation is **not** complete when tests pass, lint passes, or the build passes.

Completion requires:

1. Render the affected routes.
2. Compare against the Vision v13 reference (`mockup.html` and relevant screenshots).
3. Check desktop and mobile.
4. Verify spacing, typography, hierarchy, composition, interaction, and motion.
5. Only then consider the task complete.

# Product Philosophy

Peergent must never feel like a generic SaaS dashboard.

The product should feel like:

- a premium AI workspace
- an intelligent colleague
- calm
- spacious
- editorial
- outcome-first
- highly readable

Avoid:

- dashboard clutter
- repetitive cards
- equal visual weight everywhere
- unnecessary borders
- decorative gradients
- fake metrics
- placeholder UI
- empty admin layouts

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

- Inspect Vision v13 reference first (see **Vision v13 Design Authority**).
- Check: accessibility, performance, and alignment with Product Philosophy.
- If something feels generic, redesign before code.

**Step 4 — Implementation**

- Production-quality only. Craftsmanship over speed.
- Every screen intentional; every interaction justified; every animation purposeful.
- Complete **Visual Verification** before marking work done.

If a proposal violates the founding documents, **stop** and propose a better alternative.

### Also immutable

- Product Blueprint (Peergent 2.0)
- Brand & Experience Blueprint
- Product Design System v1.0

**Do not redesign UX, IA, workflows, or brand** to solve engineering problems — except where legacy UI conflicts with the Constitution, Product Bible, or Vision v13 reference; then the founding documents and Vision v13 win as applicable.

## Implementation guide

Read **`docs/IMPLEMENTATION.md`** before any feature work. It defines phases, architecture, testing, and what to preserve vs replace.

Supporting docs:

- `docs/architecture/OVERVIEW.md` — layers, state, data flow
- `docs/design-system/V1.md` — token quick reference
- `docs/blueprints/README.md` — blueprint authority
- `docs/reference/peergent-vision-v13/` — Vision v13 mockup and screenshots

Legacy docs (`PEERGENT_DESIGN_BIBLE.md`, `DESIGN_TOKENS.md`, root `PEERGENT_PRODUCT_BLUEPRINT.md`) are **pre-2.0**. When they conflict with 2.0 blueprints or Vision v13, **2.0 and Vision v13 win**.

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

When uncertain: re-read the blueprints and inspect the Vision v13 reference. Implement with engineering excellence. Do not redesign UX, IA, or brand unless explicitly instructed.

## Current phase

**Phase 0:** Complete — `PgReviewBar` + `PgInspector`; review dead-end fixed. See `docs/architecture/PHASE_0.md`.

**Phase 1:** Complete — `/home` morning command center. See `docs/architecture/PHASE_1.md`.

**Phase 2:** Complete — `/inbox`, `PgAppShell`, `PgNav`, `PgButton`. See `docs/IMPLEMENTATION.md`.

**Phase 3:** Complete — Peer Studio at `/team/[peerId]` (Marketing). See `docs/IMPLEMENTATION.md`.

**Next:** Phase 4+ per `docs/IMPLEMENTATION.md`.

See `docs/IMPLEMENTATION.md` for full phase plan.
