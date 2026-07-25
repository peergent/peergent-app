import type { WorkPlaneState } from "@/lib/peer-experience/marketing/resolve-work-plane-state";

const STATE_LABELS: Record<WorkPlaneState, string> = {
  empty: "Waiting to begin",
  working: "Maya is writing",
  document: "Viewing document",
  review: "Draft ready for your review",
  publication: "Ready to publish",
  completion: "Published",
};

export function buildStudioAnnouncement(input: {
  workPlaneState: WorkPlaneState;
  archiveLabel?: string;
  presenceLine: string;
}): string {
  if (input.archiveLabel) {
    return `Archive: ${input.archiveLabel}`;
  }

  return STATE_LABELS[input.workPlaneState];
}
