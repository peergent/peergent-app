import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";

export type MissionControlCtaKind =
  | "open_task"
  | "review_deliverable"
  | "assign_work"
  | "open_performance";

export type MissionControlCta = {
  kind: MissionControlCtaKind;
  label: string;
  href?: string;
  workUnitId?: string;
  draftId?: string;
};

export function resolveMissionControlCta(input: {
  activeWorkUnit: WorkUnit | null;
  approvalDraft: MarketingContentDraft | null;
  peerId: string;
}): MissionControlCta | null {
  if (input.approvalDraft) {
    return {
      kind: "review_deliverable",
      label: "Review deliverable",
      draftId: input.approvalDraft.id,
    };
  }

  if (input.activeWorkUnit && !input.activeWorkUnit.cancelled) {
    return {
      kind: "open_task",
      label: "View current task",
      workUnitId: input.activeWorkUnit.id,
    };
  }

  return {
    kind: "assign_work",
    label: "Assign work to Emma",
  };
}

export function resolveMissionPerformanceSummary(
  metrics: { id: string; label: string; value: string }[]
): { id: string; label: string; value: string }[] {
  return metrics.slice(0, 4);
}
