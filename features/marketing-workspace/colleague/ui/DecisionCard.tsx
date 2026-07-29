"use client";

import {
  ClipboardCheck,
  FileText,
  Layers,
  Link2,
  Palette,
  Sparkles,
} from "lucide-react";
import type { PeerAttentionItemViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import { SectionAction } from "./PeerColleaguePrimitives";

const ICONS = {
  strategy: Sparkles,
  creative: Palette,
  content: FileText,
  plan: Layers,
  approval: ClipboardCheck,
  connection: Link2,
} as const;

export type DecisionCardProps = {
  item: PeerAttentionItemViewModel;
};

export function DecisionCard({ item }: DecisionCardProps) {
  const Icon = ICONS[item.icon] ?? ClipboardCheck;
  return (
    <li className="mw-cc-decision-card" data-testid={`mw-decision-${item.id}`}>
      <div className="mw-cc-decision-icon" aria-hidden>
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="mw-cc-decision-body">
        <p className="mw-cc-decision-title">{item.title}</p>
        {item.projectTitle ? (
          <p className="mw-cc-decision-context">{item.projectTitle}</p>
        ) : null}
        <p className="mw-cc-decision-reason mw-clamp-2">{item.whyItMatters}</p>
        {item.ageLabel ? <p className="mw-cc-decision-age">{item.ageLabel}</p> : null}
      </div>
      <div className="mw-cc-decision-actions">
        <SectionAction href={item.href} label={item.primaryActionLabel} />
      </div>
    </li>
  );
}

export type DecisionCardListProps = {
  items: readonly PeerAttentionItemViewModel[];
};

export function DecisionCardList({ items }: DecisionCardListProps) {
  return (
    <ul className="mw-cc-decision-list">
      {items.map((item) => (
        <DecisionCard key={item.id} item={item} />
      ))}
    </ul>
  );
}
