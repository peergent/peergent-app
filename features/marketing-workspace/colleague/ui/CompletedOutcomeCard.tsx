"use client";

import { CircleCheck } from "lucide-react";
import type { PeerCompletedOutcomeViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { SectionAction } from "./PeerColleaguePrimitives";

export type CompletedOutcomeCardProps = {
  item: PeerCompletedOutcomeViewModel;
  copy: PeerWorkspaceCopy;
};

export function CompletedOutcomeCard({ item, copy }: CompletedOutcomeCardProps) {
  return (
    <li className="mw-cc-outcome-card">
      <div className="mw-cc-outcome-icon" aria-hidden>
        <CircleCheck size={18} strokeWidth={1.75} />
      </div>
      <div className="mw-cc-outcome-body">
        <p className="mw-cc-outcome-title">{item.title}</p>
        {item.projectTitle && item.summary !== item.projectTitle ? (
          <p className="mw-cc-outcome-context">{item.projectTitle}</p>
        ) : null}
        {item.summary ? (
          <p className="mw-cc-outcome-summary mw-clamp-2">{item.summary}</p>
        ) : null}
        {item.completedTimeLabel ? (
          <p className="mw-cc-outcome-time">{item.completedTimeLabel}</p>
        ) : null}
      </div>
      {item.href ? (
        <SectionAction href={item.href} label={copy.sectionViewResult} variant="secondary" />
      ) : null}
    </li>
  );
}

export type CompletedOutcomeTimelineProps = {
  groups: Array<{
    key: string;
    label: string;
    items: PeerCompletedOutcomeViewModel[];
  }>;
  copy: PeerWorkspaceCopy;
};

export function CompletedOutcomeTimeline({ groups, copy }: CompletedOutcomeTimelineProps) {
  return (
    <div className="mw-cc-outcome-timeline" data-testid="mw-section-done">
      {groups.map((group) => (
        <section key={group.key} className="mw-cc-outcome-group">
          <h2 className="mw-cc-subheading">{group.label}</h2>
          <ul className="mw-cc-outcome-list">
            {group.items.map((item) => (
              <CompletedOutcomeCard key={item.id} item={item} copy={copy} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
