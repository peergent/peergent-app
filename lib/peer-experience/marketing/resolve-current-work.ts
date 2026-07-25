import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import {
  resolveMarketingWorkflowFocus,
  type MarketingWorkflowFocus,
} from "@/lib/marketing-workspace/workflow-focus";
import type { PublicationPackage } from "@/lib/peer-workflow";
import {
  DELEGATION_WORKFLOW_STAGES,
  EMPLOYEE_WORKFLOW_STAGES,
  idleStatusLine,
  statusLineForGenerating,
} from "./emma-narrative";
import type { EmmaCurrentWorkViewModel, EmmaPipelineStage } from "./emma-workspace-types";

export type ResolveCurrentWorkInput = {
  campaignTitle: string | null;
  generating: GeneratingActivity | null;
  generatingActivity?: string | null;
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  publicationPackages?: PublicationPackage[];
  delegationTaskTitle?: string | null;
  delegationNeedsVisual?: boolean;
};

function stage(
  id: string,
  label: string,
  status: EmmaPipelineStage["status"],
  options?: { subtitle?: string; waitLabel?: string }
): EmmaPipelineStage {
  return {
    id,
    label,
    subtitle: options?.subtitle,
    progress: status === "complete" ? 100 : 0,
    status,
    waitLabel: options?.waitLabel ?? (status === "pending" ? "Waiting" : undefined),
  };
}

function stagesThroughActive(
  labels: readonly { id: string; label: string }[],
  activeIndex: number,
  activeSubtitle?: string
): EmmaPipelineStage[] {
  return labels.map((item, index) => {
    if (index < activeIndex) {
      return stage(item.id, item.label, "complete");
    }
    if (index === activeIndex) {
      return stage(item.id, item.label, "active", { subtitle: activeSubtitle });
    }
    return stage(item.id, item.label, "pending");
  });
}

function buildGeneratingStages(
  generating: GeneratingActivity,
  generatingActivity?: string | null,
  delegationNeedsVisual?: boolean
): EmmaPipelineStage[] {
  if (generating === "draft" && delegationNeedsVisual) {
    const activeIndex = 2;
    return stagesThroughActive(
      DELEGATION_WORKFLOW_STAGES,
      activeIndex,
      generatingActivity ? `Writing ${generatingActivity.toLowerCase()}` : undefined
    );
  }

  const activeIndex =
    generating === "draft"
      ? 3
      : generating === "publication"
        ? 6
        : { understanding: 0, strategy: 1, plan: 2 }[
            generating as "understanding" | "strategy" | "plan"
          ] ?? 0;

  const subtitle =
    generating === "draft" && generatingActivity
      ? `Writing ${generatingActivity.toLowerCase()} draft`
      : undefined;

  return stagesThroughActive(EMPLOYEE_WORKFLOW_STAGES, activeIndex, subtitle);
}

function resolveTitle(
  input: ResolveCurrentWorkInput,
  focus: MarketingWorkflowFocus
): string | null {
  if (input.delegationTaskTitle) return input.delegationTaskTitle;
  if (input.campaignTitle) return input.campaignTitle;

  switch (focus.kind) {
    case "write_next":
      return focus.title;
    case "draft_review":
    case "draft_approved":
    case "ready_to_publish":
      return focus.title;
    default:
      return input.campaignTitle;
  }
}

function resolveActiveStageLabel(stages: EmmaPipelineStage[]): string | null {
  return stages.find((s) => s.status === "active")?.label ?? null;
}

function buildFromFocus(
  input: ResolveCurrentWorkInput,
  focus: MarketingWorkflowFocus
): EmmaCurrentWorkViewModel {
  const title = resolveTitle(input, focus);
  let stages: EmmaPipelineStage[] = [];
  let isActive = false;
  let statusLine = idleStatusLine(
    input.drafts.some((d) => d.status === "draft" || d.status === "ready_for_review"),
    input.drafts.some((d) => d.status === "approved" || d.status === "ready_to_publish")
  );
  let sectionSubtitle = "I'm here when you need me.";

  switch (focus.kind) {
    case "generating":
      stages = buildGeneratingStages(
        focus.activity,
        focus.activityLabel,
        input.delegationNeedsVisual
      );
      isActive = true;
      statusLine = statusLineForGenerating(focus.activity, focus.activityLabel);
      sectionSubtitle =
        title && focus.activity !== "understanding"
          ? `I'm working on ${title}.`
          : statusLine;
      break;

    case "write_next":
      stages = stagesThroughActive(EMPLOYEE_WORKFLOW_STAGES, 3, focus.title);
      isActive = true;
      statusLine = `Ready to write "${focus.title}".`;
      sectionSubtitle = `Next up: ${focus.title}.`;
      break;

    case "draft_review": {
      const draft = input.drafts.find((d) => d.id === focus.draftId);
      const visualStages = draft?.contentType === "social_media_post";
      const pipeline = visualStages ? DELEGATION_WORKFLOW_STAGES : EMPLOYEE_WORKFLOW_STAGES;
      const activeIndex = visualStages ? 5 : 5;
      stages = stagesThroughActive(pipeline, activeIndex, "Awaiting your review");
      isActive = true;
      statusLine = "Waiting for your approval.";
      sectionSubtitle = `"${focus.title}" is ready for your review.`;
      break;
    }

    case "draft_approved":
      stages = stagesThroughActive(EMPLOYEE_WORKFLOW_STAGES, 6, "Preparing for publication");
      isActive = true;
      statusLine = "Approved — preparing for publication.";
      sectionSubtitle = `"${focus.title}" is approved and being prepared.`;
      break;

    case "ready_to_publish":
      stages = stagesThroughActive(EMPLOYEE_WORKFLOW_STAGES, 6, "Ready to publish");
      isActive = true;
      statusLine = "Ready to publish when you give the word.";
      sectionSubtitle = `"${focus.title}" is packaged and ready to go live.`;
      break;

    case "strategy_complete":
      stages = stagesThroughActive(EMPLOYEE_WORKFLOW_STAGES, 2, "Campaign plan next");
      isActive = true;
      statusLine = "Strategy is ready — campaign plan is next.";
      sectionSubtitle = "Your marketing strategy is complete.";
      break;

    case "ready_for_strategy":
      stages = stagesThroughActive(EMPLOYEE_WORKFLOW_STAGES, 1, "Strategy draft next");
      isActive = true;
      statusLine = "Ready to build your marketing strategy.";
      sectionSubtitle = "I'll start with your marketing strategy.";
      break;

    case "knowledge_incomplete":
      stages = stagesThroughActive(EMPLOYEE_WORKFLOW_STAGES, 0, "Gathering business context");
      isActive = true;
      statusLine = "Getting oriented with your business.";
      sectionSubtitle = "I'm learning your business context first.";
      break;

    case "monitoring":
      if (input.plan && input.drafts.some((d) => d.status === "published")) {
        stages = EMPLOYEE_WORKFLOW_STAGES.map((s) => stage(s.id, s.label, "complete"));
      }
      statusLine = "Monitoring campaign performance.";
      sectionSubtitle = "I'm watching how your content performs.";
      break;

    case "campaign_complete":
      stages = EMPLOYEE_WORKFLOW_STAGES.map((s) => stage(s.id, s.label, "complete"));
      statusLine = "This campaign chapter is complete.";
      sectionSubtitle = "Everything in the current plan is done.";
      break;
  }

  return {
    primaryTask: null,
    queue: [],
    selectedWorkUnitId: null,
    campaignTitle: title,
    activeStageLabel: resolveActiveStageLabel(stages),
    sectionSubtitle,
    isActive,
    statusLine,
    stages,
    etaMinutes: null,
  };
}

/**
 * Stable Current Work resolution — never drops from a valid pipeline to empty
 * when workflow focus still implies active work.
 */
export function resolveCurrentWork(input: ResolveCurrentWorkInput): EmmaCurrentWorkViewModel {
  const focus = resolveMarketingWorkflowFocus({
    generating: input.generating,
    generatingActivity: input.generatingActivity,
    understanding: input.understanding,
    strategy: input.strategy,
    plan: input.plan,
    drafts: input.drafts,
    publicationPackages: input.publicationPackages,
  });

  if (input.generating) {
    return buildFromFocus(input, {
      kind: "generating",
      activity: input.generating,
      activityLabel: input.generatingActivity ?? undefined,
    });
  }

  return buildFromFocus(input, focus);
}
