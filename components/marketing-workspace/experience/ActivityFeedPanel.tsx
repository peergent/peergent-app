"use client";

import Timeline from "@/components/ui/Timeline";
import WorkspacePanel from "@/components/peer-detail/WorkspacePanel";
import type { ActivityFeedItem, ArtifactSection } from "@/lib/marketing-workspace/experience";
import { formatActivityTime, resolveActivityTarget } from "@/lib/marketing-workspace/experience";

type ActivityFeedPanelProps = {
  items: ActivityFeedItem[];
  onNavigate?: (section: ArtifactSection) => void;
};

export default function ActivityFeedPanel({ items, onNavigate }: ActivityFeedPanelProps) {
  return (
    <WorkspacePanel
      title="Activity"
      description="Recent work — select an item to open the related section."
      compact
    >
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Activity appears when artifacts change.</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const target = resolveActivityTarget(item);
            const clickable = Boolean(target && onNavigate);

            return (
              <button
                key={item.id}
                type="button"
                disabled={!clickable}
                onClick={() => target && onNavigate?.(target)}
                className="pg-focus-premium w-full rounded-[12px] border border-transparent px-2 py-2 text-left transition hover:border-white/[0.06] hover:bg-white/[0.02] disabled:cursor-default disabled:hover:border-transparent disabled:hover:bg-transparent"
              >
                <Timeline
                  variant="quiet"
                  timestampPosition="left"
                  items={[
                    {
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      timestamp: formatActivityTime(item.timestamp),
                      tone:
                        item.activityType === "waiting_approval"
                          ? "warning"
                          : item.activityType === "strategy_completed" ||
                              item.activityType === "plan_completed" ||
                              item.activityType === "draft_approved"
                            ? "success"
                            : item.activityType === "gap_detected"
                              ? "warning"
                              : "default",
                    },
                  ]}
                />
              </button>
            );
          })}
        </div>
      )}
    </WorkspacePanel>
  );
}
