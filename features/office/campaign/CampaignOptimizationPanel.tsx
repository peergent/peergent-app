"use client";

import PgVisionModal from "@/components/design-system/PgVisionModal";
import type { CampaignExecutionMode } from "@/lib/office/campaign/workflow-types";
import type { CampaignResultsViewModel } from "@/lib/office/campaign/build-campaign-results";

export type CampaignOptimizationPanelProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  executionMode: CampaignExecutionMode;
  results: CampaignResultsViewModel;
  channels: readonly string[];
};

function ProgressBar({ ratio }: { ratio: number }) {
  const filled = Math.round(Math.min(1, Math.max(0, ratio)) * 12);
  return (
    <div
      className="mt-3 font-mono text-[13px] tracking-[0.12em] text-[var(--pg-v13-blue)]"
      aria-hidden
      data-testid="campaign-duration-progress"
    >
      {"█".repeat(filled)}
      {"░".repeat(12 - filled)}
    </div>
  );
}

export default function CampaignOptimizationPanel({
  open,
  onClose,
  locale,
  executionMode,
  results,
  channels,
}: CampaignOptimizationPanelProps) {
  const nl = locale === "nl";

  const modeCopy =
    executionMode === "manual"
      ? nl
        ? "Ik laat je zien wat ik zou aanpassen — jij beslist."
        : "I'll show you what I would adjust — you decide."
      : executionMode === "semi_automatic"
        ? nl
          ? "Ik stel verbeteringen voor en vraag eerst jouw akkoord."
          : "I suggest improvements and ask for your approval first."
        : nl
          ? "Ik voer toegestane verbeteringen automatisch door en leg vast wat ik heb veranderd."
          : "I apply allowed improvements automatically and record what changed.";

  return (
    <PgVisionModal open={open} onClose={onClose} size="workspace" testId="campaign-optimization-panel">
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">Emma</p>
        <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">
          {results.isRunning
            ? nl
              ? "Resultaten & optimalisatie"
              : "Results & optimization"
            : nl
              ? "Campagneresultaten"
              : "Campaign results"}
        </h3>
      </div>

      <div className="max-h-[55vh] overflow-y-auto px-7 py-6">
        {results.isRunning && results.hasSufficientData ? (
          <section
            className="mb-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4"
            data-testid="campaign-running-monitor"
          >
            <p className="text-[13px] font-semibold text-[var(--pg-v13-ink)]">
              {results.campaignStatus}
            </p>
            {results.progressRatio != null ? <ProgressBar ratio={results.progressRatio} /> : null}
            {results.runningStatusLabel ? (
              <p className="mt-2 text-[12.5px] font-medium text-[var(--pg-v13-ink-soft)]">
                {results.runningStatusLabel}
              </p>
            ) : null}
            {results.durationRangeLabel ? (
              <p className="mt-1 text-[12px] text-[var(--pg-v13-ink-faint)]">{results.durationRangeLabel}</p>
            ) : null}
            {results.daysRemaining != null ? (
              <p className="mt-1 text-[12px] font-semibold text-[var(--pg-v13-blue)]">
                {results.daysRemaining} {nl ? "dagen resterend" : "days remaining"}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4">
          <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
            {nl ? "Emma volgt de campagne" : "Emma is monitoring"}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
            {results.emmaMonitoringIntro || results.emmaAnalysis}
          </p>
          {channels.length > 0 ? (
            <p className="mt-2 text-[12px] text-[var(--pg-v13-ink-faint)]">
              {nl ? "Kanalen" : "Channels"}: {channels.join(", ")}
            </p>
          ) : null}
        </div>

        {results.hasSufficientData ? (
          <>
            <section className="mt-6">
              <p className="pg-v13-sec-label">{nl ? "Resultaten" : "Results"}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.metrics.map((metric) => (
                  <div key={metric.id} className="pg-v13-panel p-4" data-testid={`result-metric-${metric.id}`}>
                    <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-[18px] font-bold text-[var(--pg-v13-ink)]">{metric.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {results.channelComparison.length > 0 ? (
              <section className="mt-6">
                <p className="pg-v13-sec-label">{nl ? "Kanaalvergelijking" : "Channel comparison"}</p>
                {results.channelComparison.map((row) => (
                  <div key={row.channel} className="mb-2 flex justify-between text-[13px]">
                    <span className="font-semibold text-[var(--pg-v13-ink)]">{row.channel}</span>
                    <span className="text-[var(--pg-v13-ink-soft)]">
                      {row.value} · {row.note}
                    </span>
                  </div>
                ))}
              </section>
            ) : null}

            {results.topPerforming.length > 0 ? (
              <section className="mt-6">
                <p className="pg-v13-sec-label">{nl ? "Best presterend" : "Top performing"}</p>
                {results.topPerforming.map((item) => (
                  <div key={item.id} className="pg-v13-settings-row mb-2">
                    <div>
                      <p className="pg-v13-settings-name">{item.label}</p>
                      <p className="pg-v13-settings-desc">
                        {item.channel} · {item.metric}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {results.underPerforming.length > 0 ? (
              <section className="mt-6">
                <p className="pg-v13-sec-label">{nl ? "Verbeterkansen" : "Underperforming"}</p>
                {results.underPerforming.map((item) => (
                  <div key={item.id} className="pg-v13-settings-row mb-2">
                    <div>
                      <p className="pg-v13-settings-name">{item.label}</p>
                      <p className="pg-v13-settings-desc">
                        {item.channel} · {item.metric}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {results.emmaRecommendations.length > 0 ? (
              <div className="mt-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4">
                <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                  {nl ? "Emma's aanbevelingen" : "Emma's recommendations"}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-[var(--pg-v13-ink-soft)]">
                  {results.emmaRecommendations.map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-blue)] bg-[var(--pg-v13-panel)] px-4 py-4">
              <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-blue)]">
                {nl ? "Volgende optimalisatie" : "Next optimization"}
              </p>
              <p className="mt-2 text-[13px] font-medium text-[var(--pg-v13-ink)]">
                {results.emmaNextOptimization}
              </p>
            </div>

            {results.suggestedActions.length > 0 ? (
              <section className="mt-6">
                <p className="pg-v13-sec-label">{nl ? "Mogelijke acties" : "Possible actions"}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {results.suggestedActions.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-3 py-3"
                      data-testid={`optimization-action-${action.id}`}
                    >
                      <p className="text-[13px] font-semibold text-[var(--pg-v13-ink)]">{action.label}</p>
                      <p className="mt-1 text-[12px] text-[var(--pg-v13-ink-soft)]">{action.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4">
              <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Waarom dit gebeurde" : "Why this happened"}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">{results.emmaWhy}</p>
            </div>
          </>
        ) : (
          <p className="mt-6 text-[14px] text-[var(--pg-v13-ink-soft)]">
            {nl
              ? "Nog onvoldoende gegevens. Zodra de campagne live is, verschijnen hier resultaten en optimalisaties."
              : "Not enough data yet. Once the campaign is live, results and optimizations appear here."}
          </p>
        )}

        <div className="mt-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4">
          <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
            {nl ? "Hoe Emma optimaliseert" : "How Emma optimizes"}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">{modeCopy}</p>
        </div>
      </div>

      <div className="border-t border-[var(--pg-v13-line-soft)] px-7 py-4">
        <button type="button" className="pg-v13-btn pg-v13-btn--ghost" onClick={onClose}>
          {nl ? "Sluiten" : "Close"}
        </button>
      </div>
    </PgVisionModal>
  );
}
