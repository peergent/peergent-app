"use client";

import { useCallback, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { DeliverablePublishPreviewViewModel } from "@/lib/peer-experience";

type DeliverablePublishPreviewProps = {
  deliverable: DeliverablePublishPreviewViewModel;
};

export default function DeliverablePublishPreview({
  deliverable,
}: DeliverablePublishPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(deliverable.copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Could not copy to clipboard. Select the text below and copy manually.");
    }
  }, [deliverable.copyText]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--pg-color-text-tertiary)]">
        <span className="rounded-full border border-[var(--pg-color-border)] px-2.5 py-1 capitalize">
          {deliverable.channel}
        </span>
        <span>Ready to go live</span>
      </div>

      <h3 className="text-xl font-semibold text-[var(--pg-color-text-primary)]">{deliverable.title}</h3>

      <div className="max-w-2xl rounded-[16px] border border-[var(--pg-color-border)] bg-[var(--pg-color-surface-raised)] p-5">
        {deliverable.previewTitle !== deliverable.title && (
          <p className="text-sm font-medium text-[var(--pg-color-text-secondary)]">{deliverable.previewTitle}</p>
        )}
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">
          {deliverable.previewBody}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleCopy()}
        className="pg-focus-premium inline-flex items-center gap-2 rounded-[14px] border border-[var(--pg-color-border)] bg-[var(--pg-color-surface-raised)] px-4 py-2.5 text-sm font-medium text-[var(--pg-color-text-secondary)] transition hover:text-[var(--pg-color-text-primary)]"
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        {copied ? "Copied" : "Copy to clipboard"}
      </button>

      {copyError && <p className="text-sm text-amber-300/90">{copyError}</p>}
    </div>
  );
}
