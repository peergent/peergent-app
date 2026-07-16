# Peergent Design Bible

## Design philosophy

Peergent should feel **intelligent, calm, and premium** — closer to Linear, Stripe, and Raycast than a generic admin template.

**Project Black — Quiet Command:** Peergent is an AI Operating System, not a dashboard. Every screen should feel like an intelligent colleague — a **Chief of Staff**, not software.

## Narrative arc (Overview — Phase 6)

The Overview is a **single-column briefing**, read top to bottom. Seven chapters, one voice:

| Step | Chapter | Question answered |
|------|---------|-------------------|
| 01 | **Business Brain** | What do I currently understand? |
| 02 | **What I'm seeing** | Why do I believe that? |
| 03 | **Next Move** | What should happen next? |
| 04 | **Biggest Opportunities** | Where is the upside? (standalone — not merged into health) |
| 05 | **Who's already working** | Who is acting on this? |
| 06 | **What I'm still missing** | What would sharpen the read? |
| 07 | **What changed since yesterday** | What moved since last check-in? |

Each chapter uses `ReportChapter`: step number + Lucide icon + title. No section descriptions — headline, conclusion, one supporting line max.

Do not think in widgets. Think in narrative.

## Business Brain

The Daily Brief is written by Peergent's AI — personally, not generated. Tone:

- Professional, concise, helpful, confident
- Never overexcited, robotic, or marketing-speak
- Every sentence: an experienced Chief of Staff briefing a CEO

## Principles

- Clear hierarchy over decorative density
- Generous spacing — premium whitespace (`space-y-10`, `p-8`–`p-12` on hero)
- Layered surfaces over shadows (base → raised → inset → hero)
- One premium accent (violet); everything else calm
- Restrained motion (200ms; pulse only for live status)
- No excessive glassmorphism, glow, or noisy neon

## Color and surfaces

- Page background: near-flat dark `#030712` with barely perceptible warmth
- Cards: layered planes — `base`, `raised`, `inset`, `hero`
- Accent: violet (`--pg-accent`, `--pg-accent-soft`, `--pg-accent-edge`)
- Success/live: emerald with soft pulse
- Muted text: `text-slate-400`, `text-slate-500`

## Typography hierarchy

| Role | Treatment |
|------|-----------|
| Headline | Brief summary — largest readable text on page |
| Display | Page greeting — demoted, compact |
| Section title | `text-base font-semibold` — confident, not loud |
| Label | `text-[11px] uppercase tracking-[0.08em]` |
| Body | `text-sm leading-6` |
| Caption | `text-xs text-slate-500` |

## Data honesty labels

Always visible on non-real data:

| Badge | Use |
|-------|-----|
| Demo insight | Executive brief, consultant summaries |
| Provisional | What I'm seeing, opportunity estimates |
| More data required | Missing inputs for scoring |
| Demo activity | Simulated peer current work |
| Demo data | Activity timelines, static lists |

Real peer name, role, and status use no demo badge.

## Component reuse

- `Sidebar` — global navigation
- `components/ui/*` — design system primitives
- `components/dashboard/*` — Overview composition and business layout
- `lib/peer-display.ts` — role labels, icons, demo activity text

## Responsive targets

- 13-inch laptops (1280px): single-column briefing column
- Mobile: same narrative order preserved top-to-bottom

## Navigation labels

- `/` sidebar label: **Overview**
- In-page voice: Chief of Staff briefing, not "Command Center dashboard"

## AI Presence (Phase 4)

Peergent should feel **accompanied** — an intelligent colleague, not software.

### Principles

- **Anticipation** — observations, not instructions; explain what was discovered and why a recommendation exists
- **AI Memory** — UI slots for historical context; never invent fake history; demo entries stay labeled
- **Invisible Intelligence** — supporting evidence reads as reasoning ("How I know this"), not integration status

### Presence modes

| Mode | Animation | Meaning |
|------|-----------|---------|
| `ready` | None | Stable |
| `live` | Soft pulse | Connected / active |
| `thinking` | Shimmer | Intelligence forming |
| `watching` | Breathe | Monitoring for signal |
| `waiting` | Static | Blocked on input |

### Briefing structure

Greeting → Today's conclusion → Why → Where this leads → How I know this → Previously noted (memory)

## Composition (Phase 5 — Planes)

Forget dashboard cards on Overview. Think in **planes** and **inset groups**.

| Pattern | Use |
|---------|-----|
| **Plane** | Full-width section — typography + whitespace only, no border/background |
| **InsetGroup** | Justified grouping — reasoning blocks, peer roster rows, completeness breakdown |
| **Hairline dividers** | `divide-y divide-white/[0.06]` between list rows |

Business Brain IS the canvas — left-aligned reading column (`max-w-3xl`), not a hero card.

Workforce = single-column roster rows, never a 2-column peer grid.

## Information architecture (Phase 6)

- **ReportChapter** — functional chapter header (step, icon, title); used for chapters 02–07; Business Brain (01) is a bespoke open plane
- **Thinking states** — data-derived labels on Business Brain (e.g. Reading website, Watching workforce, Waiting for analytics)
- **Copy discipline** — ~30–40% shorter than Phase 4; no redundant section descriptions
- **Opportunities** — own chapter; designed to evolve into a major intelligence engine in future versions
