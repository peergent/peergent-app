import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { ActivityFeedItem } from "@/lib/marketing-workspace/experience";
import type { WorkspaceRegion } from "@/lib/marketing-workspace/experience/navigation";
import {
  buildDraftExplainability,
  buildPlanExplainability,
  buildStrategyExplainability,
  buildUnderstandingExplainability,
} from "@/lib/marketing-workspace/experience";
import type {
  DeliverableViewModel,
  DetailSecondaryAction,
  DetailSlideOverKind,
  DetailsRowViewModel,
  DetailsViewModel,
} from "../types";
import { presentExplainability } from "./details-explainability";
import type { ExplainabilityPresentationViewModel } from "./details-explainability";

export type BuildMarketingDetailsInput = {
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  deliverable: DeliverableViewModel;
  profileCounts: { goals: number; content: number };
  activityFeed: ActivityFeedItem[];
};

function rowAction(
  label: string,
  slideOverKind: DetailSlideOverKind
): DetailSecondaryAction {
  return { label, slideOverKind };
}

function understandingStatus(understanding: MarketingUnderstanding | null): string {
  if (!understanding?.available) return "Not ready";
  if (understanding.completeness >= 70) return "Ready";
  if (understanding.completeness >= 40) return "Partial";
  return "Needs attention";
}

function understandingSummary(understanding: MarketingUnderstanding | null): string {
  if (!understanding?.available) {
    return "Business context will appear once knowledge is available.";
  }
  return (
    understanding.brand.positioningStatement ??
    `${understanding.completeness}% complete · ${understanding.products.length} products · ${understanding.customerSegments.length} segments`
  );
}

function strategySummary(strategy: MarketingStrategy | null): string {
  if (!strategy) return "Strategy will appear here after you create it with Maya.";
  return strategy.summary.length > 120 ? `${strategy.summary.slice(0, 117)}…` : strategy.summary;
}

function planSummary(plan: MarketingPlan | null): string {
  if (!plan) return "Campaign plan will appear here after your strategy is approved.";
  const count = plan.contentCalendar?.length ?? 0;
  const summary = plan.summary ?? "Campaign plan on file";
  return `${summary.slice(0, 80)}${summary.length > 80 ? "…" : ""} · ${count} planned ${count === 1 ? "piece" : "pieces"}`;
}

function explainabilitySummary(
  available: boolean,
  deliverable: DeliverableViewModel
): string {
  if (!available) return "Reasoning will be available once there is work to inspect.";
  if (deliverable.kind === "content") {
    return `Why I wrote "${deliverable.title}".`;
  }
  if (deliverable.kind === "document") {
    return `How I built your ${deliverable.title.toLowerCase()}.`;
  }
  return "See why Maya made the current recommendation.";
}

export function buildMarketingDetailsViewModel(
  input: BuildMarketingDetailsInput
): DetailsViewModel {
  const rows: DetailsRowViewModel[] = [
    {
      id: "business-context",
      title: "Business context",
      subtitle: "What I know about your business",
      status: understandingStatus(input.understanding),
      summary: understandingSummary(input.understanding),
      region: "understanding",
      secondaryAction: input.understanding?.available
        ? rowAction("View full context", "business-context")
        : undefined,
    },
    {
      id: "marketing-strategy",
      title: "Marketing strategy",
      subtitle: "Positioning and priorities",
      status: input.strategy ? "On file" : "Not started",
      summary: strategySummary(input.strategy),
      region: "strategy",
      secondaryAction: input.strategy
        ? rowAction("View full strategy", "strategy")
        : undefined,
    },
    {
      id: "campaign-plan",
      title: "Campaign plan",
      subtitle: "Timeline and content",
      status: input.plan ? "On file" : input.strategy ? "Next step" : "Waiting",
      summary: planSummary(input.plan),
      region: "plan",
      secondaryAction: input.plan ? rowAction("View full plan", "plan") : undefined,
    },
    {
      id: "explainability",
      title: "Why did Maya…?",
      subtitle: "Decision context",
      status: resolveExplainabilityAvailable(input) ? "Available" : "Not yet",
      summary: explainabilitySummary(resolveExplainabilityAvailable(input), input.deliverable),
      region: null,
      secondaryAction: resolveExplainabilityAvailable(input)
        ? rowAction("View reasoning", "explainability")
        : undefined,
    },
    {
      id: "recent-decisions",
      title: "Recent decisions",
      subtitle: "Your campaign history",
      status: "Coming soon",
      summary:
        input.activityFeed.length > 0
          ? `${Math.min(input.activityFeed.length, 3)} recent events in the activity feed.`
          : "A concise log of approvals and publications will appear here.",
      region: null,
    },
  ];

  return { rows };
}

function resolveExplainabilityAvailable(input: BuildMarketingDetailsInput): boolean {
  const { deliverable, drafts, strategy, plan, understanding } = input;

  if (deliverable.kind === "content" || deliverable.kind === "document") {
    return true;
  }
  if (deliverable.kind === "publish-preview" || deliverable.kind === "complete") {
    return Boolean(drafts.find((draft) => draft.id === deliverable.draftId));
  }
  return Boolean(strategy || plan || understanding?.available);
}

export function resolveExplainabilityPresentation(
  input: BuildMarketingDetailsInput
): ExplainabilityPresentationViewModel | null {
  const { deliverable, understanding, strategy, plan, drafts } = input;

  if (deliverable.kind === "content" || deliverable.kind === "publish-preview" || deliverable.kind === "complete") {
    const draft = drafts.find((item) => item.id === deliverable.draftId);
    if (draft) {
      return presentExplainability(buildDraftExplainability(draft));
    }
  }

  if (deliverable.kind === "document") {
    if (deliverable.documentType === "strategy" && strategy) {
      return presentExplainability(buildStrategyExplainability(strategy));
    }
    if (deliverable.documentType === "plan" && plan) {
      return presentExplainability(buildPlanExplainability(plan));
    }
    if (deliverable.documentType === "understanding" && understanding?.available) {
      return presentExplainability(buildUnderstandingExplainability(understanding));
    }
  }

  if (strategy) {
    return presentExplainability(buildStrategyExplainability(strategy));
  }
  if (plan) {
    return presentExplainability(buildPlanExplainability(plan));
  }
  if (understanding?.available) {
    return presentExplainability(buildUnderstandingExplainability(understanding));
  }

  return null;
}

export function slideOverKindForRegion(region: WorkspaceRegion): DetailSlideOverKind | null {
  switch (region) {
    case "understanding":
      return "business-context";
    case "strategy":
      return "strategy";
    case "plan":
      return "plan";
    case "drafts":
      return null;
  }
}

export function slideOverKindForDocumentType(
  documentType: "understanding" | "strategy" | "plan"
): DetailSlideOverKind {
  switch (documentType) {
    case "understanding":
      return "business-context";
    case "strategy":
      return "strategy";
    case "plan":
      return "plan";
  }
}

export function slideOverTitleForKind(kind: DetailSlideOverKind): string {
  switch (kind) {
    case "business-context":
      return "Business context";
    case "strategy":
      return "Marketing strategy";
    case "plan":
      return "Campaign plan";
    case "explainability":
      return "Why did Maya decide this?";
  }
}
