# Marketing Workspace — Visual Direction

**Status:** Visual design guide — PX-24 (final design document)  
**Authority:** Subordinate to [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), [Marketing Workspace Bible](./MARKETING_WORKSPACE_BIBLE.md), [Marketing Workspace Wireframes](./MARKETING_WORKSPACE_WIREFRAMES.md), Home Command Center (PX-21). Does not modify frozen architecture.  
**Scope:** Visual identity only. No React, CSS, components, or implementation.  
**Length:** Implementation-ready. No further planning documents required.

---

## 1. Visual personality

Emma's workspace should feel like **a senior marketing manager's office** — not a tool you operate.

| Attribute | Expression |
|-----------|------------|
| **Calm** | One dominant focal point per viewport. Generous whitespace. No competing hero elements. |
| **Premium** | Restraint over decoration. Quality through typography, spacing, and surface discipline — not effects. |
| **Executive** | Outcomes before tasks. Numbers earn their place. Recommendations read like counsel, not upsells. |
| **Creative** | Content and previews feel editorial — studio wall, not file cabinet. Restrained on Workspace; fuller on Content tab. |
| **Focused** | Linear clarity: one primary action per screen state. Nothing shouts unless it requires judgment. |
| **Alive** | Emma is working — presence dot, subtle motion on live rows, green timestamps on newest activity. Never theatrical. |
| **Professional** | Manrope editorial type, confident copy, Dutch/EN register. No startup hype, no AI novelty aesthetics. |

**The feeling to protect:** *"I have a senior marketing manager working for me."*

**The feeling to reject:** *"I'm looking at another SaaS dashboard."*

**Benchmark extraction (principles only):**

- **Inspace** — outcomes lead; AI presence is ambient, not the headline  
- **Linear** — density with clarity; status is quiet metadata  
- **Stripe** — numbers are precise or absent; empty states honest  
- **Vercel** — premium polish through hierarchy and restraint  
- **Arc** — spatial consistency; same shell, predictable memory  
- **Apple Intelligence** — intelligence feels contextual and personal, never bolted-on  

---

## 2. Color philosophy

**One design language.** Marketing Workspace uses the same Vision v13 tokens as Home. Marketing introduces **peer scope** through `--pg-peer-marketing` — not a new palette.

### Where color appears

| Context | Treatment |
|---------|-----------|
| **Peer scope indicator** | Marketing blue on active tab underline, presence dot, briefing top accent (2px) |
| **Business Impact hero** | One gradient **value** or chart series — same as Home Business Impact band |
| **Decisions** | Amber attention accent on left bar / badge — identical to Home "Wacht op jou" |
| **Recommendation** | Soft grad-soft panel fill (P2) — peer recommendation pattern from Design System |
| **Live / success** | Green for live timestamps, pulse dot, positive deltas — never full green cards |
| **Content previews** | Channel-native thumbnail colors inside preview frame — not page chrome |

### Where color does NOT appear

- Full-page gradients behind content bands  
- Gradient headings stacked on the same viewport (max **one** display gradient element)  
- Rainbow KPI tiles with equal weight  
- Purple/blue mesh orbs on **every** tab — command-center atmosphere on **Workspace only**  
- Workflow page — neutral surfaces; pipeline dots use peer accent sparingly  
- Settings — almost entirely neutral; connection status uses semantic green/red dots only  

### Neutral surfaces

**Default:** `--pg-office-panel` white/off-white cards on `--pg-office-canvas` wash.

Use neutral for:

- Work row lists  
- Workflow stage history  
- Settings categories  
- Supporting KPI tiles (non-hero)  
- Inner approval cards inside the decisions module  

Neutrals communicate **records and process**. Color communicates **presence, impact, and judgment**.

### Business Impact highlight

Business Impact is the **one place** color earns hero weight on Workspace and Performance:

- Hero metric may use gradient value treatment (P0)  
- Chart primary series: Marketing blue, single series  
- Supporting metrics stay upright ink, smaller, no gradient  

If data is absent, **remove color hero** — show honest empty copy and one Settings link. Never gray-out fake zeros.

---

## 3. Card hierarchy

Reuse Design System tiers P0–P5. Marketing Workspace band mapping:

| Tier | Marketing use | Visual weight | Max per viewport |
|------|---------------|---------------|------------------|
| **P0 Hero** | Business Impact hero metric; Performance hero KPI | Raised card, optional gradient stat, 16px radius, light shadow | 1 band |
| **P1 Attention** | Wacht op jou module; Content waiting strip | Amber accent; same executive module as Home | 3 items |
| **P2 Insight** | Emma briefing; Recommendation; Performance optimization | grad-soft fill or briefing italic voice; calm border | 1–2 bands |
| **P3 Record** | Work rows; Content preview cards; Active work summary | Compact panel, 11–12px inner radius, minimal shadow | Unlimited in lists |
| **P4 Config** | Settings rows | settings-row pattern, no elevation | Unlimited |
| **P5 System** | Workflow evidence; disclosure panels | Collapsed, muted, monospace labels | 0 by default |

### Which cards deserve attention

**Loudest (when present):** Decision cards — entrepreneur must see them without hunting.

**Strong:** Briefing voice, hero KPI, primary recommendation CTA.

**Moderate:** Business Impact chart, campaign presence header.

**Quiet:** Work rows, content drafts, workflow history, settings list items.

**Silent:** Empty bands — omitted entirely, not gray placeholder cards.

### Hero vs supporting vs utility

| Type | Example | Rule |
|------|---------|------|
| **Hero** | €12.400 influenced revenue | One per viewport; largest type; only metric that answers "is it working?" |
| **Supporting** | Leads, ROAS, CPL tiles | Smaller, upright, semantic delta pills — never same size as hero |
| **Utility** | Filter chips, search, disclosure toggles | No card shell; inline chrome only |

**Inner approval cards** inside the Wacht op jou module are **supporting P3** — lightweight inset surfaces, not standalone floating heroes.

---

## 4. Charts

### What makes a chart premium

- **One story** — title states the question; insight line states the answer  
- **Single primary series** — Marketing blue; area fill ≤12% opacity  
- **Minimal axes** — faint grid; no chartjunk  
- **Honest period** — 30d default; 7d / 90d toggle inline  
- **Lives inside a card** — never bare SVG on page  
- **Insight beneath** — 30% of band height is words, 70% is chart (Inspace ratio)  

Premium charts feel **editorial**, not **analytical**. The entrepreneur reads the insight; the chart confirms it.

### How many charts per page

| Page | Default | Maximum |
|------|---------|---------|
| **Workspace** | 1 (Business Impact band) | 1 |
| **Performance** | 1 primary trend | 3 (each distinct business question) |
| **Campaign drill-down** | 0–1 small snapshot if live | 1 |
| **Work, Content, Workflow, Settings** | 0 | 0 |

### Questions charts must answer

| Chart | Question |
|-------|----------|
| Revenue influenced over time | Are we trending up? |
| Leads by channel (Performance, expanded) | Where should we invest? |
| Campaign leads snapshot | Is this campaign working? |

**Forbidden:** pie charts, donut walls, gauges, sparkline grids without labels, decorative trend lines on every KPI tile.

---

## 5. Imagery

Marketing is visual. Imagery belongs where **the market sees the work** — not where Emma thinks.

| Surface | Imagery role |
|---------|--------------|
| **Content tab** | **Primary home** — preview-first cards: LinkedIn post mock, ad creative, email header, blog hero, landing screenshot, video thumbnail |
| **Campaign drill-down** | Content preview strip — 3–6 thumbs, horizontal scroll |
| **Workspace** | No hero imagery — text briefing + metrics. Optional tiny channel dots only |
| **Work** | No thumbnails — typographic rows |
| **Performance** | No imagery — numbers and charts only |
| **Review surface** | Full deliverable preview — post mock, strategy doc, budget table as appropriate |
| **Settings** | Service logos on connection cards only (LinkedIn, Meta, GA4) |

### Preview treatment

- **Aspect ratio matches channel** — square LinkedIn, 16:9 video, email subject block  
- **Rounded 10–12px** inside card — consistent with Design System  
- **Status pill overlays corner** — Live · Draft · Scheduled  
- **No stock photography** as decoration — only real or honest placeholder ("Preview unavailable")  

### Social previews

Render **in-channel context** when possible — LinkedIn post frame, email inbox snippet, ad unit frame. The entrepreneur should recognize the channel instantly without reading a label.

---

## 6. Emma

Emma is **felt more than seen**. She is not a chatbot mascot in the corner.

### Visibility model

| Surface | Emma presence |
|---------|---------------|
| **Workspace Band A** | Name, role, status pill, one first-person sentence — **always** |
| **Workspace Band B** | Briefing in **italic peer voice** — signature moment |
| **Recommendation** | "Emma beveelt aan" label — first person in body |
| **Work / Content / Performance** | Neutral system headers — Emma voice in empty states only |
| **Workflow** | One intro line in first person, then factual stage names |
| **Review** | Short intro above deliverable — "I prepared this because…" |

### Avatar

**Small avatar (32–40px)** in Band A presence only — same treatment as Home team pulse. **No large character illustration** on every page. **No animated avatar**. **No chat bubble UI**.

Tab bar shows **Emma · Marketing** in peer scope header, not on every band.

### When Emma speaks

- Briefing when something **meaningfully changed**  
- Empty states — calm guidance + one CTA  
- Recommendations when **confidence is sufficient**  
- Review intros — context for judgment  
- Errors — one apology, one next step  

### When Emma stays silent

- No change since last visit — Presence one-liner suffices; briefing may collapse  
- Workflow stage advances — silent until visit  
- Routine content publishes within autonomy — outcome appears in Recent Outcomes, not a speech  
- Performance within normal range — no narrative overlay on charts  

**Rule:** Emma's voice is **scarce**. Scarcity creates trust.

---

## 7. Motion

Maximum **10 rules**. Nothing flashy.

| # | Rule | Reinforces |
|---|------|------------|
| 1 | Presence dot **soft pulse** when Emma is actively working | Live workforce |
| 2 | Newest activity row / outcome: **green timestamp**, optional dot pulse — older rows fade | Live workforce |
| 3 | Approval card hover: **2px lift**, soft shadow deepen — 180ms ease | Premium quality |
| 4 | Tab switch: **crossfade content**, no slide | Confidence, calm |
| 5 | Band enter on first load: **opacity 0→1**, 200ms stagger ≤40ms between bands — once per session | Premium quality |
| 6 | Chart draw on mount: **line sweep** 400ms — reduced-motion off only | Premium quality |
| 7 | Live content row in Content grid: **subtle border glow** on publish — once, not loop | Live workforce |
| 8 | Review bar approve: **checkmark settle** 150ms — then navigate | Confidence |
| 9 | Disclosure expand/collapse: **height + opacity**, 200ms — no bounce | Premium quality |
| 10 | **No motion** on KPI numbers, headings, or Workflow page default | Confidence |

**Never:** spinning loaders without copy, pulsing CTAs, parallax mesh, typing indicators, animated gradients, chart loops.

**Always:** `prefers-reduced-motion` disables pulse, stagger, and chart sweep.

---

## 8. Do's & Don'ts

### DO

- Reuse Home executive card shell — same radius (16px outer), shadow, padding (24px)  
- Show business outcomes in briefing bullets and Recent Outcomes  
- Use whitespace as hierarchy — 40px between major bands  
- Make recommendations **one** actionable card with business rationale  
- Keep Work rows typographic and calm  
- Make Content preview-first and channel-native  
- Use Marketing blue as **accent**, not wallpaper  
- Omit empty bands completely  
- Show real metrics or honest connect prompts  
- Keep review bar **sticky and persistent** during approval  

### DON'T

- Create KPI walls — max 5 metrics on Performance, 1 hero dominant  
- Overuse gradients — one gradient hero element per viewport  
- Animate everything — see motion rules  
- Expose Brain layers, nodes, or "AI processing" on default paths  
- Use tables as default layout on Content or Work  
- Stack equal-weight cards in Workspace  
- Show Workflow timeline on Workspace or Campaign default  
- Use pie charts, gauge widgets, or fake demo data in production  
- Duplicate Home Wacht op jou copy with different visual treatment  
- Introduce a second typography scale or card style unique to Marketing  

---

## 9. Visual references — reuse vs evolve

**Do not invent a second design language.** Marketing Workspace composes existing Home and Design System patterns.

### Reuse directly (from Home PX-21)

| Home pattern | Marketing use |
|--------------|---------------|
| Executive briefing card | Workspace Band B |
| Business Impact band (KPI + chart + insight) | Workspace Band C; Performance hero |
| Wacht op jou approval module | Workspace Band D; Campaign decision band |
| Recommendation hero strip | Workspace Band E; Performance optimization |
| Live activity stream aesthetic | Workspace Band G (peer-scoped, softer) |
| KPI tile hierarchy (label → trend → value) | Performance supporting tiles |
| Section header system (14px / 500 / soft ink) | All tab page headers |
| Spacing rhythm 8·12·16·24·32·40 | All pages |
| `PgVisionShell` + peer tab bar | Global chrome |

### Evolve (same language, peer-scoped variants)

| Pattern | Evolution |
|---------|-----------|
| Home KPI row (4 tiles) | Performance: 1 hero + 3 supporting — not 4 equal tiles |
| Home mid-row two-column | Workspace: optional side-by-side Briefing + Impact on wide screens only — stack on narrow |
| Nav grid (Home) | **Not on Marketing Workspace** — peer tabs replace |
| Content preview | **New composition** using existing `Pg*` card primitives and channel preview frames from Design System |
| Work row | **New composition** using P3 record row pattern — quieter than Home attention cards |
| Workflow pipeline | **New composition** — neutral, monospace stage labels, no chart |

### Canvas widths (frozen)

| Tab | Canvas mode |
|-----|-------------|
| Workspace | narrative (960px) |
| Work, Campaign, Content | workspace (1080px) |
| Performance | dashboard (1160px) |
| Workflow | workspace (1080px) |
| Settings | settings (920px) |

### Typography (frozen)

- **Headers:** 14px section titles — same as Home  
- **Briefing body:** 17px italic — peer voice only  
- **Hero metric:** clamp(28px–34px) — same KPI scale as Home  
- **Row titles:** 13–14px semibold  
- **Metadata:** 10–11px IBM Plex Mono for timestamps  

---

## 10. Final vision statement

Opening Emma's Marketing Workspace should feel like stepping into the office of a **senior marketing manager who already started the day before you arrived** — calm lighting, clear priorities on the desk, one chart that answers whether last month's bet paid off, three approval folders only if your signature is truly needed, and a single recommendation worth reading. The interface speaks in **business outcomes**, not software states; it uses **color sparingly** to mark presence, impact, and judgment; it shows **real previews** where creative work lives and **quiet typography** everywhere else. It shares the exact visual DNA of the Home Command Center — same cards, same rhythm, same restraint — with Marketing blue whispering that you are in Emma's domain. Nothing animates without purpose. Nothing shouts unless your decision matters. When you close the tab, you feel not that you managed a dashboard, but that **competent marketing leadership is underway**.

---

## Implementation gate

This is the **last design document**. Next sprint: build.

Implementation team should reference, in order:

1. [Marketing Workspace Wireframes](./MARKETING_WORKSPACE_WIREFRAMES.md) — layout and flows  
2. This document — visual decisions  
3. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — tokens and components  
4. Home Command Center (PX-21) — quality bar for side-by-side comparison  

No further architecture or planning documents unless a **bug** or **Bible amendment** is formally approved.

---

*PX-24 complete. Marketing Workspace visual direction frozen.*
