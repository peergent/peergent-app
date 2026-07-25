"use client";

import type { DeliverableCompleteViewModel } from "@/lib/peer-experience";

type DeliverableCompleteProps = {
  deliverable: DeliverableCompleteViewModel;
};

export default function DeliverableComplete({ deliverable }: DeliverableCompleteProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--pg-color-text-tertiary)]">
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 capitalize text-emerald-200/90">
          {deliverable.channel}
        </span>
        <span className="text-emerald-300/80">Live</span>
      </div>

      <h3 className="text-xl font-semibold text-[var(--pg-color-text-primary)]">{deliverable.title}</h3>
      <p className="max-w-xl text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">{deliverable.message}</p>

      {deliverable.completedAt && (
        <p className="text-xs text-[var(--pg-color-text-tertiary)]">
          Published {new Date(deliverable.completedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
