"use client";

import type { ApprovalItem } from "@/lib/peer-detail";
import WorkspacePanel from "./WorkspacePanel";

type ApprovalQueueProps = {
  items: ApprovalItem[];
  onApprove: (id: string) => void;
  onReview: (id: string) => void;
};

export default function ApprovalQueue({
  items,
  onApprove,
  onReview,
}: ApprovalQueueProps) {
  return (
    <WorkspacePanel
      title="Approval queue"
      description="Work waiting for your decision."
    >
      {items.length === 0 ? (
        <p className="rounded-[18px] border border-white/[0.05] bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-500">
          Nothing waiting for you.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-[18px] border border-white/[0.05] bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-white">{item.title}</h3>
                <time className="text-xs text-slate-600">{item.requestedAt}</time>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {item.context}
              </p>
              <p className="mt-2 text-xs text-slate-600">
                {item.reason}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onApprove(item.id)}
                  className="pg-focus-premium rounded-[14px] bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onReview(item.id)}
                  className="pg-focus-premium rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-400 transition hover:border-white/[0.14] hover:text-white"
                >
                  Review
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WorkspacePanel>
  );
}
