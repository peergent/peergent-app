"use client";

import ThinkingState from "@/components/ui/ThinkingState";
import type { DeliverableEmptyViewModel } from "@/lib/peer-experience";

type DeliverableEmptyProps = {
  deliverable: DeliverableEmptyViewModel;
};

export default function DeliverableEmpty({ deliverable }: DeliverableEmptyProps) {
  return (
    <div className="py-4">
      <h3 className="text-base font-semibold text-[var(--pg-color-text-primary)]">{deliverable.title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">
        {deliverable.message}
      </p>
      {deliverable.detail && (
        <p className="mt-2 max-w-xl text-sm text-[var(--pg-color-text-tertiary)]">{deliverable.detail}</p>
      )}
      {deliverable.working && (
        <div className="mt-5">
          <ThinkingState mode="thinking" label="Writing…" />
        </div>
      )}
    </div>
  );
}
