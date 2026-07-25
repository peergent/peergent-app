"use client";

import { Check, Globe, Mail, Share2 } from "lucide-react";
import type { EmmaRecentlyFinishedViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import EmmaCard from "../components/EmmaCard";
import EmmaWorkspaceSection from "../components/EmmaWorkspaceSection";

export type EmmaRecentlyFinishedProps = {
  model: EmmaRecentlyFinishedViewModel;
  onOpenItem?: (draftId: string) => void;
};

function platformIcon(platform: string) {
  const normalized = platform.toLowerCase();
  if (normalized.includes("linkedin")) return Share2;
  if (normalized.includes("mail") || normalized.includes("email")) return Mail;
  return Globe;
}

export default function EmmaRecentlyFinished({
  model,
  onOpenItem,
}: EmmaRecentlyFinishedProps) {
  return (
    <EmmaWorkspaceSection title="Recently Finished" className="emma-workspace-section--compact">
      {!model.hasItems ? (
        <EmmaCard>
          <p className="emma-voice emma-voice--muted">{model.emptyMessage}</p>
        </EmmaCard>
      ) : (
        <EmmaCard className="emma-finished-card">
          <ul className="emma-finished-list">
            {model.items.map((item) => {
              const Icon = platformIcon(item.platform);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="emma-finished-item pg-focus-premium"
                    onClick={() => onOpenItem?.(item.draftId)}
                    disabled={!onOpenItem}
                  >
                    <span className="emma-finished-item__icon" aria-hidden>
                      <Icon size={14} />
                    </span>
                    <span className="emma-finished-item__main">
                      <span className="emma-finished-item__title">{item.title}</span>
                      <span className="emma-finished-item__meta">
                        {item.status} · {item.timeLabel}
                      </span>
                    </span>
                    <Check size={16} className="emma-finished-item__check" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </EmmaCard>
      )}
    </EmmaWorkspaceSection>
  );
}
