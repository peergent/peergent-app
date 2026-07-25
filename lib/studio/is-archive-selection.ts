import type { TimelineViewModel } from "@/lib/peer-experience";

export type ArchiveSelection = {
  active: boolean;
  label?: string;
};

/** Archive depth — user browses a completed chapter via the progress rail. */
export function resolveArchiveSelection(timeline: TimelineViewModel): ArchiveSelection {
  const selectedId = timeline.selectedNodeId;
  if (!selectedId || selectedId === timeline.currentNodeId) {
    return { active: false };
  }

  const node = timeline.nodes.find((item) => item.id === selectedId);
  if (!node || node.progress !== "completed") {
    return { active: false };
  }

  return { active: true, label: node.label };
}
