"use client";

import type { OfficeExecutiveBriefingSummaryVm } from "@/lib/office/campaign/present-office-executive-briefing";

export type OfficeExecutiveBriefingSummaryProps = {
  model: OfficeExecutiveBriefingSummaryVm;
  locale: "nl" | "en";
  expandedSection: string | null;
  onToggleSection: (sectionId: string) => void;
  onOpenInspector: () => void;
  approvalSlot: React.ReactNode;
};

function MetadataPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-bg)] px-3 py-2">
      <p className="pg-v13-mono text-[10px] uppercase tracking-wide text-[var(--pg-v13-ink-faint)]">
        {label}
      </p>
      <p className="mt-0.5 text-[14px] font-semibold text-[var(--pg-v13-ink)]">{value}</p>
    </div>
  );
}

function BriefingSection({
  id,
  title,
  summary,
  expanded,
  onToggle,
  children,
  testId,
}: {
  id: string;
  title: string;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  testId: string;
}) {
  return (
    <section className="border-t border-[var(--pg-v13-line-soft)] pt-4" data-testid={testId}>
      <button
        type="button"
        id={`briefing-section-${id}`}
        className="flex w-full items-start justify-between gap-3 text-left pg-focus-premium"
        aria-expanded={expanded}
        aria-controls={`briefing-section-panel-${id}`}
        onClick={onToggle}
      >
        <h3 className="m-0 text-[15px] font-semibold text-[var(--pg-v13-ink)]">{title}</h3>
        <span className="shrink-0 text-[12px] font-medium text-[var(--pg-v13-blue)]">
          {expanded ? "−" : "+"}
        </span>
      </button>
      {(expanded || !children) && summary ? (
        <p
          id={`briefing-section-panel-${id}`}
          className="mt-2 text-[14px] leading-relaxed text-[var(--pg-v13-ink-soft)]"
        >
          {summary}
        </p>
      ) : null}
      {expanded && children ? (
        <div id={`briefing-section-panel-${id}`} className="mt-3">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default function OfficeExecutiveBriefingSummary({
  model,
  locale,
  expandedSection,
  onToggleSection,
  onOpenInspector,
  approvalSlot,
}: OfficeExecutiveBriefingSummaryProps) {
  const nl = locale === "nl";

  return (
    <article
      className="mx-auto w-full max-w-[720px] overflow-hidden rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] shadow-[0_1px_0_rgba(0,0,0,0.03)]"
      data-testid="office-executive-briefing-summary"
    >
      <header className="border-b border-[var(--pg-v13-line-soft)] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--pg-v13-blue)] text-[14px] font-semibold text-white"
            aria-hidden
          >
            E
          </div>
          <div className="min-w-0 flex-1">
            <p className="pg-v13-eyebrow m-0">Emma · Marketing</p>
            <h2 className="mt-1 text-[20px] font-semibold leading-snug text-[var(--pg-v13-ink)] sm:text-[22px]">
              {model.headerTitle}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pg-v13-ink-soft)]"
                data-testid="briefing-status-indicator"
              >
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--pg-v13-blue)]"
                  aria-hidden
                />
                {model.statusLabel}
              </span>
            </div>
          </div>
        </div>
        <p
          className="mt-4 text-[15px] leading-relaxed text-[var(--pg-v13-ink-soft)]"
          data-testid="briefing-human-summary"
        >
          {model.humanSummary}
        </p>
        <div
          className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"
          data-testid="briefing-metadata"
          aria-label={nl ? "Samenvatting campagne" : "Campaign summary"}
        >
          <MetadataPill
            label={nl ? "Beslissingen" : "Decisions"}
            value={model.metadata.decisionCount}
          />
          <MetadataPill label={nl ? "Kanalen" : "Channels"} value={model.metadata.channelCount} />
          <MetadataPill
            label={nl ? "Deliverables" : "Deliverables"}
            value={model.metadata.deliverableCount}
          />
          <MetadataPill
            label={nl ? "Van jou nodig" : "Need from you"}
            value={model.metadata.customerActionCount}
          />
        </div>
      </header>

      <div className="space-y-0 px-5 py-4 sm:px-6 sm:py-5">
        {model.primaryAdvice ? (
          <section className="pb-4" data-testid="briefing-primary-advice">
            <h3 className="pg-v13-sec-label m-0">{nl ? "Mijn advies" : "My recommendation"}</h3>
            <p className="mt-2 text-[16px] font-medium leading-relaxed text-[var(--pg-v13-ink)]">
              {model.primaryAdvice.recommendation}
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {model.primaryAdvice.whyAudience ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--pg-v13-ink-faint)]">
                    {nl ? "Waarom dit publiek" : "Why this audience"}
                  </dt>
                  <dd className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)]">
                    {model.primaryAdvice.whyAudience}
                  </dd>
                </div>
              ) : null}
              {model.primaryAdvice.whyNow ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--pg-v13-ink-faint)]">
                    {nl ? "Waarom nu" : "Why now"}
                  </dt>
                  <dd className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)]">
                    {model.primaryAdvice.whyNow}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--pg-v13-ink-faint)]">
                  {nl ? "Verwachte impact" : "Expected impact"}
                </dt>
                <dd className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)]">
                  {model.primaryAdvice.businessImpact}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--pg-v13-ink-faint)]">
                  {nl ? "Vertrouwen" : "Confidence"}
                </dt>
                <dd className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)]">
                  {model.primaryAdvice.confidence}
                </dd>
              </div>
            </dl>
            {model.primaryAdvice.rejectedAlternative ? (
              <p className="mt-3 text-[12px] text-[var(--pg-v13-ink-faint)]">
                {nl ? "Niet gekozen:" : "Not chosen:"}{" "}
                <span className="text-[var(--pg-v13-ink-soft)]">
                  {model.primaryAdvice.rejectedAlternative.alternative} —{" "}
                  {model.primaryAdvice.rejectedAlternative.reason}
                </span>
              </p>
            ) : null}
          </section>
        ) : null}

        <BriefingSection
          id="why-it-works"
          title={nl ? "Waarom dit werkt" : "Why this works"}
          summary={model.whyItWorks}
          expanded={expandedSection === "why-it-works"}
          onToggle={() => onToggleSection("why-it-works")}
          testId="briefing-section-why-it-works"
        />

        {model.executionPhases.length > 0 ? (
          <BriefingSection
            id="execution"
            title={nl ? "Zo pak ik het aan" : "How I'll execute"}
            expanded={expandedSection === "execution"}
            onToggle={() => onToggleSection("execution")}
            testId="briefing-section-execution"
          >
            <ol className="m-0 list-none space-y-3 p-0" data-testid="briefing-execution-stepper">
              {model.executionPhases.map((phase) => (
                <li key={phase.order} className="flex gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--pg-v13-blue)] text-[12px] font-bold text-[var(--pg-v13-blue)]"
                    aria-hidden
                  >
                    {phase.order}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[var(--pg-v13-ink)]">{phase.title}</p>
                    {phase.purpose ? (
                      <p className="mt-0.5 text-[13px] text-[var(--pg-v13-ink-soft)]">
                        {phase.purpose}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </BriefingSection>
        ) : null}

        <section
          className="border-t border-[var(--pg-v13-line-soft)] pt-4"
          data-testid="briefing-section-customer-needs"
        >
          <h3 className="m-0 text-[15px] font-semibold text-[var(--pg-v13-ink)]">
            {nl ? "Dit heb ik nog van jou nodig" : "What I still need from you"}
          </h3>
          {model.customerNeedsEmpty ? (
            <p className="mt-2 text-[14px] text-[var(--pg-v13-ink-soft)]">
              {nl
                ? "Ik heb op dit moment niets extra's van je nodig."
                : "I don't need anything extra from you right now."}
            </p>
          ) : (
            <ul className="mt-3 space-y-3 p-0">
              {model.customerNeeds.map((need) => (
                <li
                  key={need.title}
                  className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-bg)] px-3 py-3"
                >
                  <p className="text-[14px] font-medium text-[var(--pg-v13-ink)]">{need.title}</p>
                  <p className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)]">{need.reason}</p>
                  {need.blocksExecution ? (
                    <p className="mt-1 text-[11px] font-medium text-[var(--pg-v13-attention)]">
                      {nl ? "Blokkeert uitvoering" : "Blocks execution"}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {model.risks.length > 0 ? (
          <BriefingSection
            id="risks"
            title={nl ? "Waar ik rekening mee houd" : "What I'm watching"}
            expanded={expandedSection === "risks"}
            onToggle={() => onToggleSection("risks")}
            testId="briefing-section-risks"
          >
            <ul className="mt-1 space-y-2 p-0">
              {model.risks.map((risk) => (
                <li key={risk} className="text-[14px] text-[var(--pg-v13-ink-soft)]">
                  {risk}
                </li>
              ))}
            </ul>
          </BriefingSection>
        ) : null}

        <section className="border-t border-[var(--pg-v13-line-soft)] pt-4" data-testid="briefing-expected-next">
          <h3 className="pg-v13-sec-label m-0">{nl ? "Verwachte vervolgstap" : "Expected next step"}</h3>
          <p className="mt-2 text-[14px] text-[var(--pg-v13-ink-soft)]">{model.expectedNextStep}</p>
        </section>
      </div>

      <footer className="border-t border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-bg)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {approvalSlot}
          <button
            type="button"
            className="pg-v13-btn pg-v13-btn--ghost w-full sm:w-auto"
            data-testid="office-briefing-view-all-btn"
            onClick={onOpenInspector}
          >
            {nl ? "Alles bekijken" : "View everything"}
          </button>
        </div>
      </footer>
    </article>
  );
}
