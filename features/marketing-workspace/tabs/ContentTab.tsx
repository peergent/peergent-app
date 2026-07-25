"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { buildMarketingContentViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-content-view-model";
import { buildMarketingContentDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-content-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { DelegationTask } from "@/lib/peer-experience/marketing/parse-delegation-intent";
import {
  CONTENT_FILTERS,
  contentMatchesFilter,
  contentStatusClass,
  contentStatusLabel,
  type ContentFilterId,
} from "../lib/content-status-map";
import MwContentPreviewModal from "../components/MwContentPreviewModal";
import MwCreateContentModal from "../components/MwCreateContentModal";

export type ContentTabProps = {
  domainInput: MarketingPeerDomainInput;
  onExecuteDelegation?: (task: DelegationTask) => Promise<void>;
  delegationBusy?: boolean;
};

function previewVariant(channel: string): string {
  const c = channel.toLowerCase();
  if (c.includes("linkedin")) return "mw-prev-linkedin";
  if (c.includes("instagram")) return "mw-prev-instagram";
  if (c.includes("blog")) return "mw-prev-blog";
  if (c.includes("email") || c.includes("mail")) return "mw-prev-email";
  return "mw-prev-linkedin";
}

export default function ContentTab({
  domainInput,
  onExecuteDelegation,
  delegationBusy,
}: ContentTabProps) {
  const vm = useMemo(() => buildMarketingContentViewModel(domainInput), [domainInput]);
  const [filter, setFilter] = useState<ContentFilterId>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = vm.items.filter((item) => {
    if (filter === "rejected") {
      const draft = domainInput.drafts.find((d) => d.id === item.draftId);
      return draft?.status === "rejected";
    }
    return contentMatchesFilter(item.status, filter);
  });

  const previewDetail = previewId
    ? buildMarketingContentDetailViewModel({ ...domainInput, contentId: previewId })
    : null;

  return (
    <>
      <section className="mw-section" style={{ animationDelay: "0.05s", marginBottom: 0 }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <FileText size={15} aria-hidden />
            All content
          </div>
          {onExecuteDelegation && (
            <button
              type="button"
              className="mw-btn-primary pg-focus-premium"
              onClick={() => setCreateOpen(true)}
            >
              + Create post
            </button>
          )}
        </div>

        <div className="mw-content-filters">
          {CONTENT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`mw-filter-chip pg-focus-premium${filter === f.id ? " mw-filter-chip--active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            className={`mw-filter-chip pg-focus-premium${filter === "rejected" ? " mw-filter-chip--active" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="mw-empty-inline">{vm.emptyMessage}</p>
        ) : (
          <div className="mw-content-grid">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className="mw-glass mw-content-card pg-focus-premium"
                onClick={() => setPreviewId(item.draftId)}
              >
                <div className={`mw-content-preview ${previewVariant(item.channel)}`}>
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" className="mw-content-preview-img" />
                  ) : null}
                </div>
                <div className="mw-content-body">
                  <div className="mw-content-platform">{item.channel}</div>
                  <div className="mw-content-snippet">{item.title}</div>
                  <span className={`mw-content-status ${contentStatusClass(item.status)}`}>
                    {contentStatusLabel(item.status)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <MwContentPreviewModal
        open={Boolean(previewId && previewDetail)}
        onClose={() => setPreviewId(null)}
        deliverable={previewDetail?.deliverable ?? null}
      />

      {onExecuteDelegation && (
        <MwCreateContentModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          peerName={domainInput.peerName}
          busy={delegationBusy}
          onExecute={onExecuteDelegation}
        />
      )}
    </>
  );
}
