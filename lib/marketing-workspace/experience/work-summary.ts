import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { WorkSummary } from "./types";

export function buildWorkSummary(input: {
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
}): WorkSummary {
  const completedToday: WorkSummary["completedToday"] = [];
  const waitingOnYou: WorkSummary["waitingOnYou"] = [];

  if (input.understanding?.available && input.understanding.completeness >= 50) {
    completedToday.push({
      id: "understanding",
      label: "Marketing understanding reviewed",
      kind: "completed",
    });
  }

  if (input.strategy) {
    completedToday.push({
      id: "strategy",
      label: "Marketing strategy",
      kind: "completed",
    });
  }

  if (input.plan) {
    completedToday.push({
      id: "plan",
      label: "Monthly plan",
      kind: "completed",
    });
  }

  const approvedDrafts = input.drafts.filter((d) => d.status === "approved");
  const pendingDrafts = input.drafts.filter(
    (d) => d.status === "draft" || d.status === "ready_for_review"
  );

  if (approvedDrafts.length > 0) {
    completedToday.push({
      id: "drafts-approved",
      label:
        approvedDrafts.length === 1
          ? "1 content draft approved"
          : `${approvedDrafts.length} content drafts approved`,
      kind: "completed",
    });
  }

  for (const draft of pendingDrafts) {
    waitingOnYou.push({
      id: `approve-${draft.id}`,
      label: `Approve ${draft.title}`,
      kind: "waiting",
    });
  }

  for (const gap of input.understanding?.gaps ?? []) {
    waitingOnYou.push({
      id: `gap-${gap}`,
      label: `Add ${formatGapShort(gap)}`,
      kind: "waiting",
    });
  }

  if (!input.strategy && input.understanding?.available) {
    waitingOnYou.push({
      id: "need-strategy",
      label: "Confirm strategy direction",
      kind: "waiting",
    });
  }

  return { completedToday, waitingOnYou };
}

function formatGapShort(gap: string): string {
  return gap
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
    .toLowerCase();
}
