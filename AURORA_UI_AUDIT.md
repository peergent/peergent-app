# Project Aurora — UI Consistency Audit

**Date:** July 2026  
**Scope:** Full codebase — `components/ui/`, `components/dashboard/`, feature pages, modals  
**Action:** Report only. No fixes applied in this pass.

---

## Executive summary

The design system (`components/ui/`) is largely token-driven. Feature pages and legacy modals still use **ad-hoc Tailwind** — especially `rounded-xl`, inline button styles, and mixed focus patterns. The highest-impact fix path: migrate page-level buttons and surfaces to `Button` / `ButtonLink` / `Card`, then normalize radius and focus in one pass.

---

## 1. Spacing

| Issue | Where | Detail |
|-------|-------|--------|
| **Section gaps inconsistent** | Overview vs feature pages | Overview uses `space-y-20 md:space-y-24`; peers/knowledge use `space-y-5`, `gap-5`, `mt-8` |
| **Card padding drift** | `Card` vs inline surfaces | Design system: `p-5 md:p-6`; inline cards use `p-4`, `p-3`, `py-16` |
| **Page gutters mixed** | `CommandCenter` vs routes | Overview `p-5 md:p-8 lg:p-10`; peers `[id] ` uses similar but knowledge/peers list differ on header margins |
| **Form field gaps** | `NewPeerModal`, pages | Mix of `mt-2`, `mt-4`, `mt-6` without consistent form rhythm |
| **Micro spacing** | Dashboard labels | `text-[11px]` labels use `mt-0.5`, `mt-1`, `mt-2`, `mt-3` interchangeably |
| **Token vs Tailwind** | `DESIGN_TOKENS.md` | Documents `space-y-6` / `space-y-8` for sections; Overview now uses 20/24 — doc drift |

**Recommendation:** Define three spacing tiers in tokens — `chapter` (80–96px), `section` (24–32px), `block` (16–24px) — and map each page type.

---

## 2. Radius

| Issue | Where | Detail |
|-------|-------|--------|
| **`rounded-xl` bypasses tokens** | Most feature pages, modals | Tailwind `rounded-xl` (12px) used ~40+ times; tokens define `--pg-radius-md` (12px) but also `--pg-radius-xl` (24px) for cards |
| **Cards use xl (24px)** | `Card`, `Modal`, `Section` | `rounded-[var(--pg-radius-xl)]` |
| **Inline cards use md (12px)** | peers, knowledge, website-intelligence | `rounded-xl` = 12px — matches `--pg-radius-md`, not `--pg-radius-xl` |
| **Modal radius outlier** | `NewPeerModal` | `rounded-3xl` (24px+) — different from `Modal` component |
| **Button radius split** | `button-variants` | sm/md → `--pg-radius-md`; lg → `--pg-radius-lg`; inline buttons → `rounded-xl` |
| **Skeleton mismatch** | peers page loading | `rounded-xl` on skeletons; `Skeleton` component uses `--pg-radius-md` |

**Recommendation:** Ban raw `rounded-xl` in feature code; use `rounded-[var(--pg-radius-md)]` for rows/tiles and `--pg-radius-xl` for outer cards only.

---

## 3. Button sizes

| Issue | Where | Detail |
|-------|-------|--------|
| **Inline buttons bypass design system** | peers, knowledge, website-intelligence, peer detail, NewPeerModal | ~25+ hand-rolled `rounded-xl bg-violet-600 px-5 py-3` buttons |
| **Height inconsistency** | Design system vs inline | `Button md` = `h-12`; inline buttons = `py-3` (~44–48px variable); peers list uses `py-2` for secondary |
| **Shadow inconsistency** | Inline primary buttons | Some use `shadow-lg shadow-violet-950/40`, design system uses `shadow-md shadow-violet-950/25` |
| **Size sm underused** | Dashboard links | Text links styled ad-hoc; `Button sm` exists but rarely used on pages |
| **Duplicate CTA patterns** | RecommendedActions + ExecutiveDailyBrief | Both render primary `ButtonLink` — correct DS usage |

**Recommendation:** Single migration: replace inline `<button>` / `<a>` CTAs with `Button` / `ButtonLink`. Add `size="page"` if `md`/`lg` gap isn't enough.

---

## 4. Heading hierarchy

| Issue | Where | Detail |
|-------|-------|--------|
| **Page titles vary widely** | Cross-route | website-intelligence hero: `text-3xl md:text-5xl`; peers: `PageHeader`; overview chapters: `text-base font-semibold` |
| **Section titles mixed** | Dashboard vs Section component | `ReportChapter` uses `text-base font-semibold`; `Section` weight variants use `text-lg` down to `text-sm` |
| **Health headline scale** | BusinessHealthPanel | `text-2xl md:text-3xl` — only large stat on Overview |
| **Label typography** | Dashboard | Consistent `text-[11px] uppercase tracking-[0.08em]` in chapters; feature pages use `text-xs uppercase tracking-wider` |
| **EmptyState title** | `EmptyState` | `text-lg font-semibold` — different from chapter titles |

**Recommendation:** Lock page title → `PageHeader` only; chapter → `ReportChapter`; in-card → `Section` weights. Unify label to `text-[11px] tracking-[0.08em]`.

---

## 5. Icon sizes

| Issue | Where | Detail |
|-------|-------|--------|
| **No icon scale token** | Global | Sizes used: 14, 16, 18, 19, 20, 22, 24, 28, 30 |
| **Sidebar** | `Sidebar.tsx` | 19px — unique |
| **Chapter headers** | ReportChapter, ExecutiveDailyBrief | 18px, strokeWidth 1.75 |
| **Row chevrons** | WorkforcePeerRow, opportunities | 14px |
| **CTA arrows** | Mixed | 16px in most ButtonLinks; 14px in inline links |
| **Avatar icons** | peer detail header | 30px inside avatar — no token |
| **Empty/upload heroes** | knowledge, DocumentUploadArea | 24–28px |

**Recommendation:** Define icon scale: `xs 14`, `sm 16`, `md 18`, `lg 20`, `xl 24`. Sidebar nav → 18px for alignment with chapter icons.

---

## 6. Padding

| Issue | Where | Detail |
|-------|-------|--------|
| **Inset rows** | IntelligenceCoverage, domains | `py-3 first:pt-5` vs peers cards `p-4` |
| **Icon containers** | Multiple | `h-8 w-8`, `h-9 w-9`, `h-10 w-10`, `h-11 w-11` for icon wells |
| **Input wrappers** | website-intelligence, NewPeerModal | Custom bordered wrappers with `px-4` vs `Input` component `px-3` |
| **Modal padding** | NewPeerModal vs Modal | Custom header/body/footer padding vs `Modal` component |

---

## 7. Focus rings

| Issue | Where | Detail |
|-------|-------|--------|
| **Three focus systems** | Global | (1) `focus-visible:ring-2 ring-violet-500/30` (2) `focus:ring-2 ring-violet-500/20` on inputs (3) `focus-visible:ring-violet-500` full opacity on Sidebar |
| **Ring offset missing** | Most dashboard links | ring without offset |
| **Input uses focus not focus-visible** | Input, Textarea, Select | `focus:ring-2` — shows ring on mouse click |
| **Aurora premium focus** | New in globals | `.pg-focus-premium` with offset — not yet adopted |
| **Button variants** | `button-variants` | `focus-visible:ring-violet-500/40` — no ring-offset |

**Recommendation:** Adopt `focusPremium` from `lib/ui/interaction.ts` across interactive elements; inputs switch to `focus-visible:` only.

---

## 8. Hover behavior

| Issue | Where | Detail |
|-------|-------|--------|
| **Card interactive lift** | `Card variant=interactive` | `-translate-y-0.5` (2px) + border — matches Aurora |
| **InsetGroup lift** | `InsetGroup interactive` | Same 2px lift — consistent |
| **Inline cards** | peer detail rows | `hover:border-violet-500/30 hover:bg-white/[0.04]` — no translate |
| **QuickAction** | design system | border + bg only — no lift |
| **Links** | dashboard | color shift only — correct |
| **Sidebar nav** | `Sidebar` | background change, no lift |
| **Table rows** | Not audited in DS | N/A yet |
| **Missing transition** | Several inline buttons | `transition` without duration token |

**Recommendation:** Interactive tiles → `hoverLift`; text links → color only; list rows → background only (Linear pattern).

---

## 9. Surface elevation

| Issue | Where | Detail |
|-------|-------|--------|
| **Hardcoded hex backgrounds** | Card, Modal, inline | `#0b1120`, `#0c1324` vs token `--pg-bg-elevated` |
| **Opacity variants** | Feature pages | `bg-white/[0.025]`, `[0.03]`, `[0.035]`, `[0.04]`, `[0.05]` — five similar surfaces |
| **Shadow inconsistency** | Card base vs inline | Card uses `shadow-xl shadow-black/10`; inline uses `shadow-2xl shadow-black/50` on NewPeerModal |
| **Backdrop blur** | Card, Section | `backdrop-blur` on DS cards; inline cards omit blur |
| **Plane vs Card** | Overview | Overview chapters use open planes; other pages still card-heavy |
| **Gradient overlay** | CommandCenter | Radial violet gradient on main — unique to Overview |

**Recommendation:** Map five surface levels to tokens: `base`, `subtle`, `muted`, `elevated`, `overlay`. Replace hex literals.

---

## 10. Motion & animation

| Issue | Where | Detail |
|-------|-------|--------|
| **Duration token drift** | `tokens.ts` vs globals | Was 180ms vs 200ms for base — aligned in Aurora pass |
| **Skeleton animation** | `Skeleton` vs peers loading | DS skeleton: pulse; peers page: static `bg-white/10` divs |
| **Enter animation** | Overview only | `pg-animate-in` on Business Brain; other chapters unanimated |
| **Loader speed** | Loader | 0.8s spin — not tokenized |

---

## 11. Component adoption gaps

| Design system component | Adoption |
|-------------------------|----------|
| `Button` / `ButtonLink` | Overview partial; feature pages mostly inline |
| `Input` / `Textarea` / `Select` | EditPeerModal partial; NewPeerModal custom fields |
| `Modal` | EditPeerModal uses DS; NewPeerModal custom |
| `PageHeader` | peers list; not website-intelligence or knowledge |
| `Skeleton` | WorkforcePanel; peers/knowledge use raw divs |
| `EmptyState` | Limited — peers empty is custom markup |
| `Card` / `Section` | Feature pages use inline bordered divs |

---

## Priority fix order (suggested)

1. **Buttons** — highest visual inconsistency, lowest risk  
2. **Radius tokens** — replace `rounded-xl` globally  
3. **Focus rings** — accessibility + premium feel  
4. **Surface opacity scale** — reduce five whites to three tokens  
5. **Icon scale** — document and apply  
6. **Spacing tiers** — align feature pages to chapter/section/block  
7. **Skeleton loading** — unify loading language  
8. **Aurora motion** — integrate `FadeSequence` / `SurfaceReveal` page-by-page  

---

## Files with highest inconsistency density

1. `components/NewPeerModal.tsx` — custom modal, buttons, inputs, radius  
2. `app/peers/[id]/page.tsx` — inline everything  
3. `app/knowledge/page.tsx` — mixed surfaces and buttons  
4. `app/website-intelligence/page.tsx` — hero typography + inline form  
5. `app/peers/page.tsx` — loading states + inline CTAs  

**Overview dashboard:** IA-stable. Minor inconsistencies only (icon wells 8 vs 9, label margins). **Do not redesign** — apply Aurora incrementally when ready.
