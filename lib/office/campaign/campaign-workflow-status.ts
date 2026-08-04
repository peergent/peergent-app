import type { CampaignWorkflowStepId } from "./workflow-types";
import type { CampaignContext } from "./campaign-context";
import { evidenceApprovalRequired } from "@/lib/office/deliverable/deliverable-cta-labels";

export function workflowBasedStatusLabel(input: {
  activeStepId?: CampaignWorkflowStepId;
  campaignContext: CampaignContext;
  executionMode: CampaignContext["executionMode"];
  pendingApprovalCount: number;
  locale?: string | null;
  lifecyclePublished?: boolean;
  lifecycleScheduled?: boolean;
}): string | null {
  const nl = input.locale === "nl";
  if (input.lifecyclePublished) return nl ? "Gepubliceerd" : "Published";
  if (input.lifecycleScheduled) return nl ? "Ingepland" : "Scheduled";
  if (input.pendingApprovalCount > 0) {
    return nl ? "Wacht op jouw goedkeuring" : "Waiting for your approval";
  }

  const step = input.activeStepId;
  if (!step) return null;

  switch (step) {
    case "website_analyzed":
      return input.campaignContext.websiteState === "missing"
        ? nl
          ? "Context wordt verzameld"
          : "Collecting context"
        : nl
          ? "Websitecontext verwerkt"
          : "Website context processed";
    case "competitors_analyzed":
      return input.campaignContext.competitorContextState === "missing"
        ? nl
          ? "Context wordt verzameld"
          : "Collecting context"
        : nl
          ? "Concurrentiecontext verwerkt"
          : "Competitor context processed";
    case "strategy_determined":
      return evidenceApprovalRequired("strategy_determined", input.executionMode)
        ? nl
          ? "Wacht op jouw strategie-akkoord"
          : "Waiting for your strategy approval"
        : nl
          ? "Strategie wordt voorbereid"
          : "Strategy being prepared";
    case "channels_selected":
      return evidenceApprovalRequired("channels_selected", input.executionMode)
        ? nl
          ? "Wacht op jouw kanaal-akkoord"
          : "Waiting for your channel approval"
        : nl
          ? "Kanalen worden gekozen"
          : "Choosing channels";
    case "deliverables_created":
      return nl ? "Campagneonderdelen worden gemaakt" : "Creating deliverables";
    case "waiting_for_approval":
      return nl ? "Wacht op jouw goedkeuring" : "Waiting for your approval";
    case "scheduled":
      return nl ? "Ingepland" : "Scheduled";
    case "published":
      if (input.lifecycleScheduled && !input.lifecyclePublished) {
        return nl
          ? "Publicatiekoppelingen zijn nog niet actief"
          : "Publishing connections are not active yet";
      }
      return nl ? "Wordt gepubliceerd" : "Publishing";
    case "optimizing":
      return nl ? "Wordt geoptimaliseerd" : "Optimizing";
    default:
      return nl ? "Strategie wordt voorbereid" : "Strategy being prepared";
  }
}

export function evidencePrimaryActionLabel(
  stepId: CampaignWorkflowStepId,
  executionMode: CampaignContext["executionMode"],
  nl: boolean
): string {
  if (
    stepId === "business_analyzed" ||
    stepId === "website_analyzed" ||
    stepId === "competitors_analyzed"
  ) {
    return nl ? "Sluiten" : "Close";
  }
  if (evidenceApprovalRequired(stepId, executionMode)) {
    if (stepId === "strategy_determined") return nl ? "Strategie goedkeuren" : "Approve strategy";
    if (stepId === "channels_selected") return nl ? "Kanaalkeuze goedkeuren" : "Approve channels";
    if (stepId === "deliverables_created") return nl ? "Onderdelen goedkeuren" : "Approve deliverables";
    return nl ? "Goedkeuren" : "Approve";
  }
  if (stepId === "strategy_determined") return nl ? "Verder naar kanaalkeuze" : "Continue to channels";
  if (stepId === "channels_selected") return nl ? "Verder naar campagneonderdelen" : "Continue to deliverables";
  if (stepId === "deliverables_created") return nl ? "Verder naar goedkeuring" : "Continue to approval";
  return nl ? "Sluiten" : "Close";
}

export function evidenceSuccessMessage(stepId: CampaignWorkflowStepId, nl: boolean): string {
  if (stepId === "strategy_determined") return nl ? "Strategie goedgekeurd" : "Strategy approved";
  if (stepId === "channels_selected") return nl ? "Kanaalkeuze goedgekeurd" : "Channels approved";
  if (stepId === "deliverables_created") return nl ? "Onderdelen goedgekeurd" : "Deliverables approved";
  return nl ? "Goedgekeurd" : "Approved";
}
