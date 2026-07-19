"use client";

import WorkspacePanel from "@/components/peer-detail/WorkspacePanel";
import type { ConversationalRecommendation } from "@/lib/marketing-workspace/experience";
import type { RecommendedAction } from "@/lib/marketing-workspace";
import { cn } from "@/lib/ui/cn";

type ConversationalRecommendationsProps = {
  recommendations: ConversationalRecommendation[];
  onAction: (action: RecommendedAction) => void;
  disabled?: boolean;
};

export default function ConversationalRecommendations({
  recommendations,
  onAction,
  disabled,
}: ConversationalRecommendationsProps) {
  return (
    <WorkspacePanel title="Recommended next" compact>
      {recommendations.length === 0 ? (
        <p className="text-sm text-slate-500">All caught up for now.</p>
      ) : (
        <ul className="space-y-3">
          {recommendations.slice(0, 3).map((rec) => (
            <li key={rec.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onAction({
                    id: rec.id,
                    title: rec.actionLabel ?? rec.peerMessage,
                    description: rec.why,
                    priority: rec.priority,
                    kind: rec.kind,
                    planActivityReference: rec.planActivityReference,
                  })
                }
                className={cn(
                  "pg-focus-premium w-full rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-left transition",
                  "hover:border-violet-500/30 hover:bg-violet-500/[0.06] disabled:opacity-50"
                )}
              >
                <p className="text-sm leading-relaxed text-slate-300">&ldquo;{rec.peerMessage}&rdquo;</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{rec.why}</p>
                {rec.actionLabel && (
                  <span className="mt-2 inline-block text-xs font-medium text-violet-400">
                    {rec.actionLabel} →
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </WorkspacePanel>
  );
}
