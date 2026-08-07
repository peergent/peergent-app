"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import PgActivityCard, { PgActivityList } from "@/components/design-system/PgActivityCard";
import PgAlertCard from "@/components/design-system/PgAlertCard";
import PgApprovalCard from "@/components/design-system/PgApprovalCard";
import PgAutomationChip from "@/components/design-system/PgAutomationChip";
import PgBriefingCard from "@/components/design-system/PgBriefingCard";
import PgChartCard from "@/components/design-system/PgChartCard";
import PgEmptyStateCard from "@/components/design-system/PgEmptyStateCard";
import PgHeroCard, { PgHeroBand } from "@/components/design-system/PgHeroCard";
import PgInsightCard from "@/components/design-system/PgInsightCard";
import PgMetricCard from "@/components/design-system/PgMetricCard";
import PgOpportunityCard from "@/components/design-system/PgOpportunityCard";
import PgPeerStatusChip from "@/components/design-system/PgPeerStatusChip";
import PgPerformanceCard from "@/components/design-system/PgPerformanceCard";
import PgRecommendationCard from "@/components/design-system/PgRecommendationCard";
import PgStatusChip from "@/components/design-system/PgStatusChip";
import PgTimelineCard from "@/components/design-system/PgTimelineCard";

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

            <section className="pg-v13-sec" data-testid="pg-ds-gallery">
              <p className="pg-v13-label">Design System v2 · Card gallery (PX-4)</p>
              <p className="mb-4 text-[13px] text-[var(--pg-v13-ink-soft)]">
                Reusable components only — not wired to product pages yet.
              </p>

              <PgHeroBand className="mb-6">
                <PgHeroCard
                  label="Waarde gecreëerd"
                  value="€41.200"
                  delta={{ direction: "up", label: "+12%", upIsGood: true }}
                  methodology="deze maand"
                  animateCounter
                />
                <PgMetricCard
                  label="Kanalen live"
                  value="3"
                  delta={{ direction: "up", label: "+1", upIsGood: true }}
                  methodology="deze week"
                  animateCounter
                />
                <PgMetricCard label="Campagnes actief" value="6" />
                <PgMetricCard label="Open beslissingen" value="1" emphasis="activity" />
              </PgHeroBand>

              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <PgBriefingCard
                  peerLabel="Emma · Marketing"
                  title="Q2 campagne voorbereid"
                  summary="Focus ligt op LinkedIn en e-mail — klaar voor goedkeuring zodra jij akkoord geeft."
                  statusLabel="Wacht op jou"
                  statusTone="waiting"
                  footer={
                    <button type="button" className="pg-v13-btn pg-v13-btn--sm">
                      Campagne bekijken
                    </button>
                  }
                />
                <PgApprovalCard
                  title="Keur Q2 campagne goed"
                  unblocks="Emma kan dan publiceren en meten."
                  primaryLabel="Goedkeuren"
                  ageLabel="2 uur geleden"
                />
              </div>

              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <PgChartCard
                  title="Organische zichtbaarheid"
                  promise="Impressies over 30 dagen"
                  insight="Groei hervat na indexatie."
                  series={{
                    points: [
                      { at: "1", value: 12 },
                      { at: "2", value: 14 },
                      { at: "3", value: 13 },
                      { at: "4", value: 18 },
                      { at: "5", value: 22 },
                      { at: "6", value: 24 },
                      { at: "7", value: 28 },
                    ],
                    label: "Impressies (×100)",
                  }}
                />
                <PgPerformanceCard
                  title="Zomeractie · Live"
                  metrics={[
                    { label: "Leads", value: "142", emphasis: "outcome" },
                    { label: "Spend", value: "€3.840", emphasis: "activity" },
                    { label: "ROAS", value: "4.2×", emphasis: "outcome" },
                  ]}
                  sparkline={[
                    { value: 10 },
                    { value: 12 },
                    { value: 11 },
                    { value: 15 },
                    { value: 18 },
                    { value: 20 },
                    { value: 22 },
                  ]}
                  recommendation="Budget verschuiven naar LinkedIn kan ROAS verbeteren."
                />
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <PgInsightCard
                  observation="LinkedIn presteert boven verwachting — overweeg budget te verschuiven."
                  recommendation="Verhoog het LinkedIn-deel met 15% en monitor ROAS 7 dagen."
                />
                <PgRecommendationCard
                  peerLabel="Emma · Marketing"
                  recommendation="Rond de Q2-campagne af voor publicatie."
                  primaryLabel="Open campagne"
                />
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <PgOpportunityCard
                  statement="Concurrent X investeert in LinkedIn — ruimte in jouw segment."
                />
                <PgAlertCard
                  title="Advertentie-account losgekoppeld"
                  context="Emma kan niet publiceren tot het account opnieuw verbonden is."
                  actionLabel="Verbind opnieuw"
                />
              </div>

              <PgActivityList className="mb-6">
                <PgActivityCard
                  title="Emma publiceerde 3 LinkedIn-posts"
                  description="Zomeractie"
                  timeLabel="2 uur geleden"
                  accentVar="var(--pg-peer-marketing)"
                  animateEnter
                />
                <PgActivityCard
                  title="Support loste 14 tickets op"
                  timeLabel="Vandaag"
                  accentVar="var(--pg-peer-support)"
                />
              </PgActivityList>

              <div className="mb-6 flex flex-wrap items-center gap-3">
                <PgStatusChip label="Live" tone="live" />
                <PgStatusChip label="Aan het werk" tone="working" pulse />
                <PgAutomationChip />
                <PgPeerStatusChip
                  name="Emma"
                  role="Marketing"
                  statusLine="Campagne voorbereiden"
                  tone="working"
                />
              </div>

              <PgTimelineCard
                className="mb-6"
                triggerLabel="Hoe Emma tot dit advies kwam"
                items={[
                  { id: "1", label: "Marktsegment geanalyseerd", icon: "check" },
                  { id: "2", label: "Budgetscenario's vergeleken", icon: "check" },
                  { id: "3", label: "Aanbeveling geformuleerd", icon: "dot" },
                ]}
              />

              <PgEmptyStateCard
                voice="Emma is klaar om je eerste campagne te bedenken."
                action={{ label: "Nieuwe campagne", href: "#" }}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
