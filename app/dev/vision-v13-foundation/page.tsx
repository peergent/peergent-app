"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

/**
 * Vision v13 Stage 1 — shared visual foundation review harness.
 *
 * Side-by-side token primitives from docs/reference/peergent-vision-v13/mockup.html.
 * Not a page migration; compare against screenshots/ before Stage 2.
 */

const SWATCHES = [
  { name: "Ink", var: "--pg-v13-ink" },
  { name: "Ink soft", var: "--pg-v13-ink-soft" },
  { name: "Ink faint", var: "--pg-v13-ink-faint" },
  { name: "Blue", var: "--pg-v13-blue" },
  { name: "Attention", var: "--pg-v13-attention" },
  { name: "Success", var: "--pg-v13-success" },
  { name: "Marketing", var: "--pg-v13-marketing" },
  { name: "Sales", var: "--pg-v13-sales" },
  { name: "Support", var: "--pg-v13-support" },
  { name: "Panel", var: "--pg-v13-panel" },
  { name: "Line", var: "--pg-v13-line" },
] as const;

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={13} height={13} aria-hidden>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth={2} />
      <path
        d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={13} height={13} aria-hidden>
      <path
        d="M21 12.5A8.5 8.5 0 1111.5 3 7 7 0 0021 12.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function VisionV13FoundationPage() {
  const { preference, setPreference, resolved } = useTheme();

  return (
    <div
      className="pg-v13-font pg-v13-scene -mx-5 -my-8 md:-mx-8"
      data-testid="vision-v13-foundation"
    >
      <div className="flex min-h-screen">
        <aside className="pg-v13-glass-rail hidden lg:flex" aria-label="Foundation preview rail">
          <div className="flex items-center gap-2">
            <div className="pg-v13-mark" aria-hidden />
            <span className="pg-v13-brand-word">Peergent</span>
          </div>

          <div className="pg-v13-theme-toggle">
            <button
              type="button"
              aria-label="Licht thema"
              aria-pressed={resolved === "light"}
              onClick={() => setPreference("light")}
            >
              <SunIcon />
            </button>
            <button
              type="button"
              aria-label="Donker thema"
              aria-pressed={resolved === "dark"}
              onClick={() => setPreference("dark")}
            >
              <MoonIcon />
            </button>
          </div>

          <p className="pg-v13-label">Stage 1</p>
          <p className="text-[12px] leading-snug text-[var(--pg-v13-ink-soft)]">
            Shared visual foundation · tokens only
          </p>
          <p className="mt-auto text-[11px] text-[var(--pg-v13-ink-faint)]">
            Theme: {preference} → {resolved}
          </p>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-[var(--pg-v13-line-soft)] px-5 py-3 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <span className="pg-v13-brand-word">Peergent</span>
              <div className="pg-v13-theme-toggle">
                <button
                  type="button"
                  aria-pressed={resolved === "light"}
                  onClick={() => setPreference("light")}
                >
                  <SunIcon />
                </button>
                <button
                  type="button"
                  aria-pressed={resolved === "dark"}
                  onClick={() => setPreference("dark")}
                >
                  <MoonIcon />
                </button>
              </div>
            </div>
          </header>

          <div className="pg-v13-canvas">
            <p className="pg-v13-eyebrow">Vision v13 · Foundation</p>
            <h1 className="pg-v13-title">Alles onder controle. Je team is aan het werk.</h1>
            <p className="pg-v13-sub">
              Drie collega&apos;s actief — <em>Sales wacht op jou.</em>
            </p>

            <section className="pg-v13-sec">
              <p className="pg-v13-label pg-v13-label--attention">Wacht op jou — 1</p>
              <div className="pg-v13-decision">
                <div>
                  <b>Campagneplan zomeractie goedkeuren</b>
                  <span>Marketing · klaar om te versturen</span>
                </div>
                <button type="button" className="pg-v13-btn pg-v13-btn--sm">
                  Bekijk
                </button>
              </div>
            </section>

            <section className="pg-v13-sec" style={{ ["--pg-v13-peer" as string]: "var(--pg-v13-marketing)" }}>
              <div className="pg-v13-brief">
                <div className="pg-v13-brief-tag">
                  <span className="pg-v13-dot" aria-hidden />
                  Marketing Peer
                </div>
                <p>
                  Focus ligt bij de zomeractie — onze grootste omzetkans deze maand. Zodra het
                  campagneplan is goedgekeurd, ga ik live met de eerste advertenties.
                </p>
                <div className="pg-v13-when">Je hoort van me zodra de advertenties staan.</div>
              </div>
            </section>

            <section className="pg-v13-sec">
              <p className="pg-v13-label">Vandaag afgerond</p>
              <div className="pg-v13-done-row">
                <span className="pg-v13-dot2" style={{ background: "var(--pg-v13-marketing)" }} />
                Marketing — 3 LinkedIn-posts, e-mailconcept
              </div>
              <div className="pg-v13-done-row">
                <span className="pg-v13-dot2" style={{ background: "var(--pg-v13-support)" }} />
                Support — 14 tickets opgelost
              </div>
            </section>

            <section className="pg-v13-sec">
              <p className="pg-v13-label">Stat boxes · KPI</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="pg-v13-stat-box">
                  <div className="pg-v13-stat-lbl">Goedgekeurde opdrachten</div>
                  <div className="pg-v13-stat-val">4</div>
                </div>
                <div className="pg-v13-stat-box">
                  <div className="pg-v13-stat-lbl">Campagnes actief</div>
                  <div className="pg-v13-stat-val">6</div>
                </div>
              </div>
            </section>

            <section className="pg-v13-sec">
              <p className="pg-v13-label">Buttons</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="pg-v13-btn">
                  Primary
                </button>
                <button type="button" className="pg-v13-btn pg-v13-btn--sm">
                  Small
                </button>
                <button type="button" className="pg-v13-btn pg-v13-btn--ghost">
                  Ghost
                </button>
              </div>
            </section>

            <section className="pg-v13-sec">
              <p className="pg-v13-label">Office surfaces (mapped tokens)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="pg-kpi-card">
                  <p className="pg-v13-label">pg-kpi-card</p>
                  <p className="mt-2 text-[15px] font-semibold text-[var(--pg-v13-ink)]">€41.200</p>
                </div>
                <div className="pg-entity-card">
                  <p className="pg-v13-label">pg-entity-card</p>
                  <p className="mt-2 text-[13.5px] text-[var(--pg-v13-ink-soft)]">
                    Mapped from v13 panel + shadow
                  </p>
                </div>
                <div className="pg-hero-surface p-5 sm:col-span-2">
                  <p className="pg-v13-label">pg-hero-surface</p>
                  <p className="mt-2 text-[17px] italic text-[var(--pg-v13-ink)]">
                    Peer briefing surface with top accent
                  </p>
                </div>
              </div>
            </section>

            <section className="pg-v13-sec">
              <p className="pg-v13-label">Colour tokens</p>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {SWATCHES.map((swatch) => (
                  <li
                    key={swatch.name}
                    className="pg-v13-surface-solid overflow-hidden"
                  >
                    <div
                      className="h-10 border-b border-[var(--pg-v13-line-soft)]"
                      style={{ background: `var(${swatch.var})` }}
                    />
                    <div className="px-2 py-1.5">
                      <p className="text-[11px] font-semibold text-[var(--pg-v13-ink)]">{swatch.name}</p>
                      <p className="pg-v13-mono truncate text-[9px] text-[var(--pg-v13-ink-faint)]">
                        {swatch.var}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="pg-v13-sec">
              <p className="pg-v13-label">Compare</p>
              <p className="text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
                Match this page against{" "}
                <code className="pg-v13-mono text-[11px]">docs/reference/peergent-vision-v13/screenshots/01_Iedereen_CommandCenter.png</code>{" "}
                (light) and{" "}
                <code className="pg-v13-mono text-[11px]">18_Donker_Iedereen.png</code>{" "}
                (dark). Canvas max-width is {920}px; section gap is {42}px.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
