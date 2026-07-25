"use client";

import Link from "next/link";
import type { MarketingKnowledgeListItem } from "../lib/build-knowledge-items";
import MwModal from "./MwModal";

export type MwKnowledgeDetailModalProps = {
  open: boolean;
  onClose: () => void;
  item: MarketingKnowledgeListItem | null;
};

export default function MwKnowledgeDetailModal({
  open,
  onClose,
  item,
}: MwKnowledgeDetailModalProps) {
  if (!item) return null;

  return (
    <MwModal open={open} onClose={onClose} title={item.title} subtitle={item.source}>
      <div className="mw-kn-detail">
        <div className="mw-channel-detail-row">
          <span className="mw-channel-detail-label">State</span>
          <span>{item.state.replace(/_/g, " ")}</span>
        </div>
        <div className="mw-channel-detail-row">
          <span className="mw-channel-detail-label">Updated</span>
          <span>{item.updatedLabel}</span>
        </div>
        {item.summary && <p className="mw-kn-helper">{item.summary}</p>}
        <Link
          href={item.href}
          className="mw-btn-primary mw-btn-primary--full pg-focus-premium"
          style={{ display: "inline-flex", justifyContent: "center", marginTop: 20 }}
        >
          Open in Knowledge
        </Link>
      </div>
    </MwModal>
  );
}
