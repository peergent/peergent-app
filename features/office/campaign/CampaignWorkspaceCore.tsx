"use client";

import Link from "next/link";
import type { CampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import type { CampaignWorkflowStep } from "@/lib/office/campaign/workflow-types";
import CampaignEmmaIntro from "./CampaignEmmaIntro";
import CampaignLifecycleBar, { resolveLifecyclePhase } from "./CampaignLifecycleBar";
import CampaignWorkflowTimeline from "./CampaignWorkflowTimeline";
import CampaignWorkingStatus from "./CampaignWorkingStatus";
import CampaignStrategyDevDiagnostics from "./CampaignStrategyDevDiagnostics";

export type CampaignWorkspaceCoreProps = {
  model: CampaignDetailViewModel;
  locale?: string | null;
  variant?: "page" | "modal";
  onStepClick?: (step: CampaignWorkflowStep) => void;
  onReviewDeliverable?: (draftId: string) => void;
  onApproveAll?: () => void;
  onNextStepCta?: () => void;
  onSchedule?: () => void;
  onPublishDemo?: () => void;
  onSkipWebsite?: () => void;
  onOpenWebsiteModal?: () => void;
  onEditWebsite?: () => void;
  onSkipCompetitors?: () => void;
  onOpenCompetitorModal?: () => void;
  onOpenOptimization?: () => void;
  onOpenSchedule?: () => void;
  onRetryStrategy?: () => void;
  onViewCampaignContext?: () => void;
  onClose?: () => void;
};

export default function CampaignWorkspaceCore({
  model,
  locale,
  variant = "page",
  onStepClick,
  onReviewDeliverable,
  onApproveAll,
  onNextStepCta,
  onSchedule,
  onPublishDemo,
  onSkipWebsite,
  onOpenWebsiteModal,
  onEditWebsite,
  onSkipCompetitors,
  onOpenCompetitorModal,
  onOpenOptimization,
  onOpenSchedule,
  onRetryStrategy,
  onViewCampaignContext,
  onClose,
}: CampaignWorkspaceCoreProps) {
  const nl = locale === "nl";
  const { workflow } = model;
  const inModal = variant === "modal";
  const cta = workflow.nextStepCta;
  const hasPending = workflow.approvalCenter.count > 0;
  const isOptimizing = model.lifecycleStatus === "published";
  const lifecyclePhase = resolveLifecyclePhase({
    lifecycleStatus: model.lifecycleStatus,
    hasPendingReview: hasPending,
    isOptimizing,
  });
  const showEmmaWorkingEmpty =
    !hasPending &&
    workflow.deliverables.length === 0 &&
    !model.websitePrompt &&
    !model.competitorPrompt &&
    model.lifecycleStatus === "planning";
  const primaryDisabled =
    (cta.action === "continue" && !cta.stepId) ||
    (cta.action === "continue" && cta.stepId === "optimizing" && !model.performanceActionable);

  const suppressPrimaryCta =
    cta.action === "working" ||
    (cta.action === "continue" && !cta.stepId) ||
    (Boolean(model.websitePrompt) &&
      cta.action === "continue" &&
      cta.stepId === "website_analyzed");

  const showStrategyFailure =
    cta.action === "retry_strategy" || cta.action === "view_context";

  const handlePrimaryCta = () => {
    if (cta.action === "open_optimization") {
      onOpenOptimization?.();
      return;
    }
    if (cta.action === "schedule") {
      (onSchedule ?? onNextStepCta)?.();
      return;
    }
    if (cta.action === "publish_demo") {
      (onPublishDemo ?? onNextStepCta)?.();
      return;
    }
    if (!primaryDisabled) onNextStepCta?.();
  };

  const handleStepClick = (step: CampaignWorkflowStep) => {
    if (step.id === "optimizing" && isOptimizing) {
      onOpenOptimization?.();
      return;
    }
    onStepClick?.(step);
  };

  return (
    <>
      {model.emmaOpeningLine ? (
        <CampaignEmmaIntro
          openingLine={model.emmaOpeningLine}
          planSteps={model.emmaPlanSteps}
          locale={locale}
        >
          {model.websitePrompt ? (
            <section
              className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-5"
              data-testid="campaign-website-prompt"
            >
              <p className="whitespace-pre-line text-[14px] text-[var(--pg-v13-ink-soft)]">
                {model.websitePrompt.message}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="pg-v13-btn"
                  data-testid="campaign-add-website"
                  onClick={onOpenWebsiteModal}
                >
                  {model.websitePrompt.addWebsiteLabel} →
                </button>
                <button
                  type="button"
                  className="pg-v13-btn pg-v13-btn--ghost"
                  data-testid="campaign-skip-website"
                  onClick={onSkipWebsite}
                >
                  {model.websitePrompt.skipLabel}
                </button>
              </div>
            </section>
          ) : null}
        </CampaignEmmaIntro>
      ) : null}

      {model.websitePrompt && !model.emmaOpeningLine ? (
        <section
          className="pg-v13-sec mb-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-5"
          data-testid="campaign-website-prompt"
        >
          <p className="whitespace-pre-line text-[14px] text-[var(--pg-v13-ink-soft)]">
            {model.websitePrompt.message}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="pg-v13-btn"
              data-testid="campaign-add-website"
              onClick={onOpenWebsiteModal}
            >
              {model.websitePrompt.addWebsiteLabel} →
            </button>
            <button
              type="button"
              className="pg-v13-btn pg-v13-btn--ghost"
              data-testid="campaign-skip-website"
              onClick={onSkipWebsite}
            >
              {model.websitePrompt.skipLabel}
            </button>
          </div>
        </section>
      ) : null}

      {model.manualChoiceSummary ? (
        <section className="pg-v13-sec mb-6" data-testid="campaign-manual-summary">
          <p className="pg-v13-sec-label">{nl ? "Jouw keuzes" : "Your choices"}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {model.manualChoiceSummary.map((row) => (
              <div key={row.label} className="pg-v13-panel min-w-0 p-4">
                <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                  {row.label}
                </p>
                <p className="mt-1 break-words text-[13px] text-[var(--pg-v13-ink-soft)]">{row.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {model.websiteEditUrl && onEditWebsite ? (
        <section className="pg-v13-sec mb-6" data-testid="campaign-website-edit">
          <button type="button" className="pg-v13-btn pg-v13-btn--ghost text-[13px]" onClick={onEditWebsite}>
            {nl ? "Website wijzigen" : "Change website"} ({model.websiteEditUrl})
          </button>
        </section>
      ) : null}

      {model.competitorPrompt ? (
        <section
          className="pg-v13-sec mb-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-5"
          data-testid="campaign-competitor-prompt"
        >
          <p className="whitespace-pre-line text-[14px] text-[var(--pg-v13-ink-soft)]">
            {model.competitorPrompt.message}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="pg-v13-btn"
              data-testid="campaign-add-competitor"
              onClick={onOpenCompetitorModal}
            >
              {model.competitorPrompt.addLabel} →
            </button>
            <button
              type="button"
              className="pg-v13-btn pg-v13-btn--ghost"
              data-testid="campaign-skip-competitors"
              onClick={onSkipCompetitors}
            >
              {model.competitorPrompt.skipLabel}
            </button>
          </div>
        </section>
      ) : null}

      {!inModal ? (
        <CampaignLifecycleBar
          phase={lifecyclePhase}
          locale={locale}
          runningLabel={model.durationSummary?.runningLabel}
          dateRangeLabel={model.durationSummary?.dateRangeLabel}
          statusLabel={model.durationSummary?.statusLabel}
        />
      ) : null}

      {!inModal && model.durationSummary?.duration && isOptimizing ? (
        <section
          className="pg-v13-sec mb-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4"
          data-testid="campaign-running-summary"
        >
          <p className="text-[13px] font-semibold text-[var(--pg-v13-ink)]">
            {nl ? "Campagne loopt" : "Campaign running"}
          </p>
          {model.resultsViewModel.progressRatio != null ? (
            <p
              className="mt-2 font-mono text-[13px] tracking-[0.12em] text-[var(--pg-v13-blue)]"
              aria-hidden
            >
              {"█".repeat(Math.round(model.resultsViewModel.progressRatio * 12))}
              {"░".repeat(12 - Math.round(model.resultsViewModel.progressRatio * 12))}
            </p>
          ) : null}
          {model.durationSummary.statusLabel ? (
            <p className="mt-2 text-[12.5px] text-[var(--pg-v13-ink-soft)]">
              {model.durationSummary.statusLabel}
            </p>
          ) : null}
          {model.durationSummary.dateRangeLabel ? (
            <p className="mt-1 text-[12px] text-[var(--pg-v13-ink-faint)]">
              {model.durationSummary.dateRangeLabel}
            </p>
          ) : null}
        </section>
      ) : null}

      {showEmmaWorkingEmpty ? (
        <section
          className="pg-v13-sec mb-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-5"
          data-testid="campaign-empty-working"
        >
          <p className="pg-v13-sec-label m-0">Emma</p>
          <p className="mt-2 text-[14px] text-[var(--pg-v13-ink-soft)]">
            {nl
              ? "Ik verzamel context en bereid de volgende stap voor. Zodra er iets klaarstaat voor jou, zie je dat hier."
              : "I'm collecting context and preparing the next step. When something is ready for you, you'll see it here."}
          </p>
        </section>
      ) : null}

      {!inModal && cta.action === "working" ? (
        <section className="pg-v13-sec mb-6" data-testid="campaign-primary-working">
          <CampaignWorkingStatus
            headline={cta.label}
            stageLabel={cta.workingStage}
            runStatus={cta.runStatus}
            locale={locale}
          />
          {cta.devDiagnostics ? (
            <CampaignStrategyDevDiagnostics
              runId={cta.devDiagnostics.runId}
              lastStatus={cta.devDiagnostics.lastStatus}
              provider={cta.devDiagnostics.provider}
              failureCode={cta.devDiagnostics.failureCode}
              fallbackUsed={cta.devDiagnostics.fallbackUsed}
              traceLastStage={cta.devDiagnostics.traceLastStage}
              locale={locale}
              triggerKey={cta.devDiagnostics.triggerKey}
              actionInvocationCount={cta.devDiagnostics.actionInvocationCount}
              actionDurationMs={cta.devDiagnostics.actionDurationMs}
              inFlightReused={cta.devDiagnostics.inFlightReused}
              terminalState={cta.devDiagnostics.terminalState}
              model={cta.devDiagnostics.model}
              inputTokens={cta.devDiagnostics.inputTokens}
              outputTokens={cta.devDiagnostics.outputTokens}
            />
          ) : null}
          <p className="mt-2 text-[12px] text-[var(--pg-v13-ink-soft)]">{workflow.nextStep}</p>
        </section>
      ) : null}

      {!inModal && showStrategyFailure ? (
        <section className="pg-v13-sec mb-6" data-testid="campaign-strategy-failure">
          {cta.failureMessage ? (
            <p className="text-[14px] text-[var(--pg-v13-ink-soft)]">{cta.failureMessage}</p>
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {cta.action === "retry_strategy" ? (
              <button
                type="button"
                className="pg-v13-btn w-full sm:w-auto"
                onClick={onRetryStrategy}
                data-testid="campaign-retry-strategy"
              >
                {cta.label}
              </button>
            ) : (
              <button
                type="button"
                className="pg-v13-btn w-full sm:w-auto"
                onClick={onViewCampaignContext}
                data-testid="campaign-view-context-primary"
              >
                {cta.label}
              </button>
            )}
            {cta.action === "retry_strategy" ? (
              <button
                type="button"
                className="pg-v13-btn pg-v13-btn--ghost w-full sm:w-auto"
                onClick={onViewCampaignContext}
                data-testid="campaign-view-context-secondary"
              >
                {nl ? "Campagnecontext bekijken" : "View campaign context"}
              </button>
            ) : null}
          </div>
          {cta.devDiagnostics ? (
            <CampaignStrategyDevDiagnostics
              runId={cta.devDiagnostics.runId}
              lastStatus={cta.devDiagnostics.lastStatus}
              provider={cta.devDiagnostics.provider}
              failureCode={cta.devDiagnostics.failureCode}
              fallbackUsed={cta.devDiagnostics.fallbackUsed}
              traceLastStage={cta.devDiagnostics.traceLastStage}
              locale={locale}
              triggerKey={cta.devDiagnostics.triggerKey}
              actionInvocationCount={cta.devDiagnostics.actionInvocationCount}
              actionDurationMs={cta.devDiagnostics.actionDurationMs}
              inFlightReused={cta.devDiagnostics.inFlightReused}
              terminalState={cta.devDiagnostics.terminalState}
              model={cta.devDiagnostics.model}
              inputTokens={cta.devDiagnostics.inputTokens}
              outputTokens={cta.devDiagnostics.outputTokens}
            />
          ) : null}
          <p className="mt-2 text-[12px] text-[var(--pg-v13-ink-soft)]">{workflow.nextStep}</p>
        </section>
      ) : null}

      {!inModal && cta && !suppressPrimaryCta && !showStrategyFailure ? (
        <section className="pg-v13-sec mb-6" data-testid="campaign-primary-cta">
          {primaryDisabled ? (
            <p className="text-[14px] font-semibold text-[var(--pg-v13-ink-soft)]">{cta.label}</p>
          ) : (
            <button type="button" className="pg-v13-btn w-full sm:w-auto" onClick={handlePrimaryCta}>
              {cta.label}
            </button>
          )}
          <p className="mt-2 text-[12px] text-[var(--pg-v13-ink-soft)]">{workflow.nextStep}</p>
        </section>
      ) : null}

      <CampaignWorkflowTimeline
        steps={workflow.steps}
        locale={locale}
        onStepClick={handleStepClick}
        compact={inModal}
      />

      {hasPending ? (
        <section className="pg-v13-sec" data-testid="campaign-approval-center">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="pg-v13-sec-label m-0">
              {nl ? "Goedkeuringscentrum" : "Approval centre"}
            </p>
            <span
              className="pg-v13-mono text-[11px] font-bold text-[var(--pg-v13-attention)]"
              data-testid="pending-approval-count"
            >
              {workflow.approvalCenter.count}
            </span>
          </div>
          {workflow.approvalCenter.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="pg-v13-settings-row mb-2 w-full text-left transition hover:bg-[var(--pg-v13-panel-hover)]"
              onClick={() => onReviewDeliverable?.(item.draftId)}
              data-testid={`deliverable-review-trigger-${item.draftId}`}
            >
              <div className="flex w-full items-start gap-3">
                <span className="mt-1 h-[14px] w-[14px] shrink-0 rounded-full border-2 border-[var(--pg-v13-ink-faint)]" />
                <div className="min-w-0 flex-1">
                  <div className="pg-v13-settings-name">{item.label}</div>
                  <div className="pg-v13-settings-desc">{item.channelLabel}</div>
                </div>
                <span className="shrink-0 text-[12px] font-semibold text-[var(--pg-v13-blue)]">
                  {nl ? "Beoordeel →" : "Review →"}
                </span>
              </div>
            </button>
          ))}
          {!inModal && onApproveAll ? (
            <button type="button" className="pg-v13-btn mt-3 w-full" onClick={onApproveAll}>
              {nl ? "Keur alles goed" : "Approve all"}
            </button>
          ) : null}
        </section>
      ) : (
        <span data-testid="pending-approval-count" className="sr-only">
          0
        </span>
      )}

      {workflow.deliverables.length > 0 ? (
        <section className="pg-v13-sec" data-testid="campaign-deliverables">
          <p className="pg-v13-sec-label">{model.deliverablesSectionLabel}</p>
          {workflow.deliverables.map((item) => (
            <Link
              key={item.id}
              href={item.detailHref}
              className="pg-v13-settings-row pg-v13-settings-row--link mb-2 block no-underline"
              onClick={inModal ? onClose : undefined}
              data-testid={`campaign-deliverable-${item.draftId}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="pg-v13-settings-name">{item.label}</div>
                  <div className="pg-v13-settings-desc">{item.channelLabel}</div>
                </div>
                <span className="pg-v13-mono shrink-0 text-[10px] font-bold uppercase text-[var(--pg-v13-ink-faint)]">
                  {item.statusLabel}
                </span>
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      {isOptimizing && !inModal ? (
        <section className="pg-v13-sec" data-testid="campaign-optimization-teaser">
          <button
            type="button"
            className="pg-v13-settings-row w-full text-left"
            onClick={() => onOpenOptimization?.()}
          >
            <p className="pg-v13-sec-label m-0">{nl ? "Optimaliseren" : "Optimizing"}</p>
            <p className="mt-2 text-[13px] text-[var(--pg-v13-ink-soft)]">
              {nl
                ? "De campagne draait. Emma volgt resultaten en kansen."
                : "Campaign is live. Emma tracks results and opportunities."}
            </p>
            <span className="mt-2 inline-block text-[12px] font-semibold text-[var(--pg-v13-blue)]">
              {model.performanceActionable ? model.performanceLabel : model.performanceLabel}
            </span>
          </button>
        </section>
      ) : null}

      {model.activityItems.length > 0 && !inModal ? (
        <section className="pg-v13-sec" data-testid="campaign-activity">
          <p className="pg-v13-sec-label">{nl ? "Wat Emma heeft gedaan" : "What Emma has done"}</p>
          {model.activityItems.map((item) => (
            <div key={item.id} className="pg-v13-settings-row mb-2">
              <div className="min-w-0">
                <div className="pg-v13-settings-name break-words">{item.title}</div>
                <div className="pg-v13-settings-desc break-words">{item.description}</div>
                <div className="pg-v13-mono mt-1 text-[10px] text-[var(--pg-v13-ink-faint)]">
                  {item.timeLabel}
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {model.scheduleInfo ? (
        <section
          className="pg-v13-sec mb-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-5"
          data-testid="campaign-schedule-info"
        >
          <p className="pg-v13-sec-label">{nl ? "Campagne ingepland" : "Campaign scheduled"}</p>
          <p className="text-[13px] text-[var(--pg-v13-ink-soft)]">
            {nl ? "Geplande publicatie" : "Planned publication"}:{" "}
            <span data-testid="campaign-schedule-at">{model.scheduleInfo.scheduledAtLabel}</span>
          </p>
          {model.scheduleInfo.channels.length > 0 ? (
            <p className="mt-1 text-[12px] text-[var(--pg-v13-ink-faint)]">
              {nl ? "Kanalen" : "Channels"}: {model.scheduleInfo.channels.join(", ")}
            </p>
          ) : null}
          {model.scheduleInfo.integrationsNote ? (
            <p className="mt-2 text-[12px] text-[var(--pg-v13-ink-soft)]" data-testid="schedule-integrations-note">
              {model.scheduleInfo.integrationsNote}
            </p>
          ) : null}
          {onOpenSchedule ? (
            <button type="button" className="pg-v13-btn pg-v13-btn--ghost mt-3 text-[13px]" onClick={onOpenSchedule}>
              {nl ? "Planning wijzigen" : "Edit schedule"}
            </button>
          ) : null}
        </section>
      ) : null}

      {inModal ? (
        <div className="mt-6 flex flex-col gap-2">
          {hasPending && onApproveAll ? (
            <button type="button" className="pg-v13-btn w-full" onClick={onApproveAll}>
              {nl ? "Keur alles goed" : "Approve all"}
            </button>
          ) : null}
          <Link
            href={model.detailHref}
            className="pg-v13-btn pg-v13-btn--ghost w-full text-center no-underline"
            onClick={onClose}
          >
            {nl ? "Open volledige campagne" : "Open full campaign"}
          </Link>
        </div>
      ) : null}
    </>
  );
}
