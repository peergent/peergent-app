"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { Decision } from "@/lib/brain/decision/decision-types";
import {
  buildExecutiveReviewNavigation,
  createBriefingFrame,
  createDecisionFrame,
  createDependencyFrame,
  createEvidenceFrame,
  createExecutionPlanFrame,
  createPlanningDecisionFrame,
  createReasoningFrame,
  createResearchFrame,
  findPlanningDecision,
  findPlanningDependency,
  getDecisionExplainabilityContent,
  popReviewFrame,
  pushReviewFrame,
  type ExecutiveReviewFrame,
} from "@/lib/brain/presentation/executive-review-disclosure";
import { presentDecisionSummary } from "@/lib/brain/decision/decision-presentation";

export type ExecutiveCampaignBriefingAppearance = "marketing" | "office";

export type ExecutiveCampaignBriefingProps = {
  briefing: ExecutiveCampaignBriefing;
  buildStepHref: (stepId: CampaignWorkflowStepId) => string;
  backHref?: string;
  locale?: "nl" | "en";
  appearance?: ExecutiveCampaignBriefingAppearance;
  onWorkflowStepOpen?: (stepId: CampaignWorkflowStepId) => void;
};

function briefingUiClasses(appearance: ExecutiveCampaignBriefingAppearance) {
  if (appearance === "office") {
    return {
      card: "rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-5",
      header: "mb-4",
      title: "pg-v13-sec-label m-0",
      helper: "mt-2 text-[12px] text-[var(--pg-v13-ink-faint)]",
      progress: "mb-4 text-[11px] text-[var(--pg-v13-ink-faint)] pg-v13-mono",
      section: "mb-2",
      sectionTitle: "pg-v13-sec-label mb-2",
      body: "text-[14px] text-[var(--pg-v13-ink-soft)]",
      list: "mt-3 grid gap-3",
      linkButton: "pg-v13-btn pg-v13-btn--ghost text-[13px] justify-start px-0",
      link: "text-[13px] font-semibold text-[var(--pg-v13-blue)] no-underline",
      subsection: "mt-4",
      footer: "mt-6 flex items-center justify-between gap-3 border-t border-[var(--pg-v13-line-soft)] pt-4",
    };
  }

  return {
    card: "mw-kn-card",
    header: "mw-kn-card-header",
    title: "mw-kn-title",
    helper: "mw-kn-helper",
    progress: "mw-kn-briefing-progress",
    section: "mw-kn-section",
    sectionTitle: "mw-kn-section-title",
    body: "mw-kn-body",
    list: "mw-kn-list",
    linkButton: "mw-kn-link-button",
    link: "mw-kn-link",
    subsection: "mw-kn-subsection",
    footer: "mw-kn-card-footer mw-kn-briefing-nav",
  };
}

function openWorkflowStep(
  stepId: CampaignWorkflowStepId,
  input: {
    onWorkflowStepOpen?: (stepId: CampaignWorkflowStepId) => void;
    buildStepHref: (stepId: CampaignWorkflowStepId) => string;
  }
) {
  if (input.onWorkflowStepOpen) {
    input.onWorkflowStepOpen(stepId);
    return;
  }
  window.location.href = input.buildStepHref(stepId);
}

function findDecision(briefing: ExecutiveCampaignBriefing, id?: string): Decision | undefined {
  if (!id) return undefined;
  return briefing.decisions.find((d) => d.id === id);
}

export default function ExecutiveCampaignBriefingPanel({
  briefing,
  buildStepHref,
  backHref,
  locale = "en",
  appearance = "marketing",
  onWorkflowStepOpen,
}: ExecutiveCampaignBriefingProps) {
  const nl = locale === "nl";
  const ui = briefingUiClasses(appearance);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [reviewStack, setReviewStack] = useState<ExecutiveReviewFrame[]>([createBriefingFrame(nl)]);

  const sections = briefing.sections;
  const activeSection = sections[sectionIndex];
  const totalSections = sections.length;
  const planningGraph = briefing.planningGraph;
  const executionPlan = briefing.executionPlan;

  const navigation = useMemo(
    () => buildExecutiveReviewNavigation({ stack: reviewStack, nl }),
    [reviewStack, nl]
  );

  const activeLayer = navigation.current.layer;
  const activeDecision = findDecision(briefing, navigation.current.decisionId);
  const activePlanningDecision = findPlanningDecision(
    planningGraph,
    navigation.current.planningDecisionId
  );
  const activeDependency = findPlanningDependency(planningGraph, navigation.current.dependencyId);

  const sectionNavLabel = useMemo(() => {
    if (!activeSection) return "";
    return `${sectionIndex + 1} / ${totalSections} — ${activeSection.title}`;
  }, [activeSection, sectionIndex, totalSections]);

  function resetToBriefing() {
    setReviewStack([createBriefingFrame(nl)]);
    setSectionIndex(0);
  }

  function openDecision(decisionId?: string) {
    const decision = findDecision(briefing, decisionId);
    if (!decision) return;
    setReviewStack(pushReviewFrame([createBriefingFrame(nl)], createDecisionFrame(decision)));
  }

  function openExecutionPlan(planningDecisionId?: string) {
    if (!planningGraph || !executionPlan) return;
    const frames: ExecutiveReviewFrame[] = [createBriefingFrame(nl), createExecutionPlanFrame(nl)];
    const planningDecision = findPlanningDecision(planningGraph, planningDecisionId);
    if (planningDecision) {
      frames.push(createPlanningDecisionFrame(planningDecision));
    }
    setReviewStack(frames);
  }

  function drillDownFromSection(section: (typeof sections)[number]) {
    if (section.id === "execution-plan" && planningGraph) {
      openExecutionPlan(section.drillDownPlanningDecisionId);
      return;
    }
    if (section.drillDownDecisionId) {
      openDecision(section.drillDownDecisionId);
      return;
    }
    if (section.drillDownStepId) {
      openWorkflowStep(section.drillDownStepId as CampaignWorkflowStepId, {
        onWorkflowStepOpen,
        buildStepHref,
      });
    }
  }

  function goBack() {
    if (reviewStack.length > 1) {
      setReviewStack(popReviewFrame(reviewStack));
      return;
    }
    if (sectionIndex > 0) {
      setSectionIndex((i) => Math.max(0, i - 1));
    }
  }

  function goForward() {
    if (activeLayer === "decision" && activeDecision) {
      setReviewStack(pushReviewFrame(reviewStack, createReasoningFrame(activeDecision, nl)));
      return;
    }
    if (activeLayer === "execution_plan" && planningGraph?.planningDecisions[0]) {
      setReviewStack(
        pushReviewFrame(
          reviewStack,
          createPlanningDecisionFrame(
            findPlanningDecision(planningGraph, navigation.current.planningDecisionId) ??
              planningGraph.planningDecisions[0]
          )
        )
      );
      return;
    }
    if (activeLayer === "planning_decision" && planningGraph?.dependencies[0]) {
      const dependency =
        planningGraph.dependencies.find((d) => d.toNodeId === activePlanningDecision?.linkedNodeIds[0]) ??
        planningGraph.dependencies[0];
      setReviewStack(pushReviewFrame(reviewStack, createDependencyFrame(dependency, nl)));
      return;
    }
    if (activeLayer === "dependency" && activeDecision) {
      setReviewStack(
        pushReviewFrame(
          reviewStack,
          createEvidenceFrame(activeDecision, activeDecision.supportingEvidence[0] ?? "summary", nl)
        )
      );
      return;
    }
    if (activeLayer === "dependency" && briefing.decisions[0]) {
      setReviewStack(
        pushReviewFrame(
          reviewStack,
          createEvidenceFrame(briefing.decisions[0], briefing.decisions[0].supportingEvidence[0] ?? "summary", nl)
        )
      );
      return;
    }
    if (activeLayer === "reasoning" && activeDecision) {
      setReviewStack(
        pushReviewFrame(
          reviewStack,
          createEvidenceFrame(activeDecision, activeDecision.supportingEvidence[0] ?? "summary", nl)
        )
      );
      return;
    }
    if (activeLayer === "evidence" && activeDecision) {
      setReviewStack(pushReviewFrame(reviewStack, createResearchFrame(activeDecision, nl)));
      return;
    }
    if (activeLayer === "briefing" && sectionIndex < totalSections - 1) {
      setSectionIndex((i) => Math.min(totalSections - 1, i + 1));
      return;
    }
    if (activeLayer !== "briefing") {
      resetToBriefing();
    }
  }

  if (!activeSection && activeLayer === "briefing") return null;

  const explainability = activeDecision ? getDecisionExplainabilityContent(activeDecision) : null;
  const showNext =
    activeLayer !== "research" && (activeLayer !== "briefing" || sectionIndex < totalSections - 1);

  return (
    <article className={ui.card} data-testid="executive-campaign-briefing">
      <header className={ui.header}>
        <h2 className={ui.title}>{briefing.title}</h2>
        <p className={ui.helper}>
          {nl
            ? "Emma heeft het denkwerk afgerond. Lees de briefing in 3–5 minuten — beslissingen en executieplan staan klaar."
            : "Emma finished the thinking. Read this in 3–5 minutes — decisions and the execution plan are ready."}
        </p>
      </header>

      {navigation.breadcrumb.length > 1 ? (
        <nav className={ui.progress} aria-label={navigation.breadcrumb.join(" › ")}>
          <span className={ui.helper}>{navigation.breadcrumb.join(" › ")}</span>
        </nav>
      ) : (
        <div className={ui.progress} aria-label={sectionNavLabel}>
          <span className={ui.helper}>{sectionNavLabel}</span>
        </div>
      )}

      {activeLayer === "briefing" && activeSection ? (
        <section className={ui.section} data-testid={`briefing-section-${activeSection.id}`}>
          <h3 className={ui.sectionTitle}>{activeSection.title}</h3>
          <p className={ui.body}>{activeSection.summary}</p>
          {activeSection.id === "top-decisions" && briefing.topDecisions.length > 0 ? (
            <ul className={ui.list}>
              {briefing.topDecisions.map((d) => (
                <li key={d.id}>
                  <button type="button" className={ui.linkButton} onClick={() => openDecision(d.id)}>
                    {d.title} ({d.confidence}) →
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {activeSection.id === "execution-plan" && executionPlan ? (
            <dl className={ui.list}>
              <div>
                <dt className={ui.helper}>{nl ? "Wat Emma wil bereiken" : "What Emma intends to achieve"}</dt>
                <dd className={ui.body}>{executionPlan.whatEmmaIntends}</dd>
              </div>
              <div>
                <dt className={ui.helper}>{nl ? "Aanbevolen volgorde" : "Recommended execution order"}</dt>
                <dd className={ui.body}>{executionPlan.recommendedOrder}</dd>
              </div>
              <div>
                <dt className={ui.helper}>{nl ? "Readiness" : "Readiness"}</dt>
                <dd className={ui.body}>{executionPlan.readiness}</dd>
              </div>
            </dl>
          ) : null}
          {activeSection.drillDownDecisionId ||
          activeSection.drillDownStepId ||
          activeSection.drillDownPlanningDecisionId ? (
            <button type="button" className={ui.linkButton} onClick={() => drillDownFromSection(activeSection)}>
              {activeSection.drillDownLabel ?? (nl ? "Open details" : "Open details")} →
            </button>
          ) : null}
        </section>
      ) : null}

      {activeLayer === "execution_plan" && executionPlan ? (
        <section className={ui.section} data-testid="execution-plan-detail">
          <h3 className={ui.sectionTitle}>{nl ? "Executieplan" : "Execution plan"}</h3>
          <dl className={ui.list}>
            <div>
              <dt className={ui.helper}>{nl ? "Wat Emma wil bereiken" : "What Emma intends to achieve"}</dt>
              <dd className={ui.body}>{executionPlan.whatEmmaIntends}</dd>
            </div>
            <div>
              <dt className={ui.helper}>{nl ? "Aanbevolen volgorde" : "Recommended execution order"}</dt>
              <dd className={ui.body}>{executionPlan.recommendedOrder}</dd>
            </div>
            <div>
              <dt className={ui.helper}>{nl ? "Waarom deze volgorde" : "Why this order"}</dt>
              <dd className={ui.body}>{executionPlan.whyThisOrder}</dd>
            </div>
            <div>
              <dt className={ui.helper}>{nl ? "Parallel mogelijk" : "What can happen in parallel"}</dt>
              <dd className={ui.body}>{executionPlan.parallelOpportunities}</dd>
            </div>
            <div>
              <dt className={ui.helper}>{nl ? "Wat Emma nog nodig heeft" : "What Emma still needs"}</dt>
              <dd className={ui.body}>{executionPlan.whatEmmaNeeds}</dd>
            </div>
            <div>
              <dt className={ui.helper}>{nl ? "Readiness" : "Readiness"}</dt>
              <dd className={ui.body}>{executionPlan.readiness}</dd>
            </div>
            <div>
              <dt className={ui.helper}>{nl ? "Belangrijkste risico's" : "Main risks"}</dt>
              <dd className={ui.body}>{executionPlan.mainRisks}</dd>
            </div>
            <div>
              <dt className={ui.helper}>{nl ? "Review-momenten" : "Review moments"}</dt>
              <dd className={ui.body}>{executionPlan.reviewMoments}</dd>
            </div>
            <div>
              <dt className={ui.helper}>{nl ? "Verwachte volgende stap" : "Expected next step"}</dt>
              <dd className={ui.body}>{executionPlan.expectedNextStep}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {activeLayer === "planning_decision" && activePlanningDecision ? (
        <section className={ui.section} data-testid={`planning-decision-${activePlanningDecision.id}`}>
          <h3 className={ui.sectionTitle}>{activePlanningDecision.title}</h3>
          <p className={ui.body}>{activePlanningDecision.summary}</p>
          <p className={ui.helper}>{activePlanningDecision.reason}</p>
          <p className={ui.body}>{activePlanningDecision.businessValue}</p>
        </section>
      ) : null}

      {activeLayer === "dependency" && activeDependency ? (
        <section className={ui.section} data-testid={`planning-dependency-${activeDependency.id}`}>
          <h3 className={ui.sectionTitle}>{nl ? "Waarom deze volgorde" : "Why this order"}</h3>
          <p className={ui.body}>{activeDependency.reason}</p>
        </section>
      ) : null}

      {activeLayer === "decision" && activeDecision ? (
        <section className={ui.section} data-testid={`decision-section-${activeDecision.id}`}>
          <h3 className={ui.sectionTitle}>{activeDecision.title}</h3>
          <p className={ui.body}>{activeDecision.recommendation}</p>
          <p className={ui.helper}>
            {nl ? "Vertrouwen" : "Confidence"}: {presentDecisionSummary(activeDecision, nl).confidence}
          </p>
          {activeDecision.customerChallenges.length > 0 ? (
            <div className={ui.subsection}>
              <h4 className={ui.sectionTitle}>{nl ? "Waarschijnlijke vragen" : "Likely questions"}</h4>
              {activeDecision.customerChallenges.map((c) => (
                <div key={c.question}>
                  <p className={ui.helper}>{c.question}</p>
                  <p className={ui.body}>{c.answer}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeLayer === "reasoning" && explainability ? (
        <section className={ui.section} data-testid="decision-reasoning">
          <h3 className={ui.sectionTitle}>{nl ? "Redenering" : "Reasoning"}</h3>
          <p className={ui.body}>{explainability.reasoning}</p>
          {explainability.alternativesRejected.length > 0 ? (
            <ul className={ui.list}>
              {explainability.alternativesRejected.map((a) => (
                <li key={a.alternative}>
                  {a.alternative}: {a.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {activeLayer === "evidence" && explainability ? (
        <section className={ui.section} data-testid="decision-evidence">
          <h3 className={ui.sectionTitle}>{nl ? "Bewijs" : "Evidence"}</h3>
          <p className={ui.body}>
            {explainability.evidenceIds.length > 0
              ? explainability.evidenceIds.join(", ")
              : nl
                ? "Geen directe evidence-referenties — zie research."
                : "No direct evidence references — see research."}
          </p>
          {explainability.assumptions.length > 0 ? (
            <>
              <h4 className={ui.sectionTitle}>{nl ? "Aannames" : "Assumptions"}</h4>
              <ul className={ui.list}>
                {explainability.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      {activeLayer === "research" && activeDecision ? (
        <section className={ui.section} data-testid="decision-research">
          <h3 className={ui.sectionTitle}>{nl ? "Research" : "Research"}</h3>
          <p className={ui.body}>
            {nl
              ? "Research en intelligence ondersteunen deze beslissing — volledige research is beschikbaar via evidence."
              : "Research and intelligence support this decision — full research is available via evidence."}
          </p>
          {activeSection?.drillDownStepId ? (
            onWorkflowStepOpen ? (
              <button
                type="button"
                className={ui.linkButton}
                onClick={() =>
                  openWorkflowStep(activeSection.drillDownStepId as CampaignWorkflowStepId, {
                    onWorkflowStepOpen,
                    buildStepHref,
                  })
                }
              >
                {nl ? "Open volledige research" : "Open full research"} →
              </button>
            ) : (
              <Link className={ui.link} href={buildStepHref(activeSection.drillDownStepId as CampaignWorkflowStepId)}>
                {nl ? "Open volledige research" : "Open full research"} →
              </Link>
            )
          ) : null}
        </section>
      ) : null}

      <footer className={ui.footer}>
        <button
          type="button"
          className={ui.linkButton}
          disabled={!navigation.canGoBack && sectionIndex <= 0}
          onClick={goBack}
        >
          ← {nl ? "Vorige" : "Previous"}
        </button>
        {showNext ? (
          <button type="button" className={ui.linkButton} onClick={goForward}>
            {nl ? "Volgende" : "Next"} →
          </button>
        ) : backHref ? (
          <Link className={ui.link} href={backHref}>
            {nl ? "Terug naar briefing" : "Back to briefing"}
          </Link>
        ) : (
          <button type="button" className={ui.linkButton} onClick={resetToBriefing}>
            {nl ? "Terug naar briefing" : "Back to briefing"}
          </button>
        )}
      </footer>
    </article>
  );
}
