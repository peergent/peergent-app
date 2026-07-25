"use client";

import type { DeliverableDocumentViewModel, DetailSlideOverKind } from "@/lib/peer-experience";
import { slideOverKindForDocumentType } from "@/lib/peer-experience/marketing/build-marketing-details-view-model";

type DeliverableDocumentProps = {
  deliverable: DeliverableDocumentViewModel;
  onOpenDetail?: (kind: DetailSlideOverKind) => void;
};

export default function DeliverableDocument({
  deliverable,
  onOpenDetail,
}: DeliverableDocumentProps) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">{deliverable.title}</p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-[var(--pg-color-text-primary)]">
        {deliverable.summary}
      </h3>

      {deliverable.metadata.length > 0 && (
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {deliverable.metadata.map((item) => (
            <div
              key={item.label}
              className="rounded-[12px] border border-[var(--pg-color-border)] bg-[var(--pg-color-surface-raised)] px-3 py-2"
            >
              <dt className="text-[10px] uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium capitalize text-[var(--pg-color-text-primary)]">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {onOpenDetail && (
        <button
          type="button"
          onClick={() => onOpenDetail(slideOverKindForDocumentType(deliverable.documentType))}
          className="pg-focus-premium mt-6 text-sm font-medium text-[var(--pg-color-accent)] transition hover:text-[var(--pg-color-accent-hover)]"
        >
          View full {deliverable.title.toLowerCase()} →
        </button>
      )}
    </div>
  );
}
