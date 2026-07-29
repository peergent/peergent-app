"use client";

import { groupCompletedOutcomes } from "@/lib/peer-experience/marketing/colleague/build-marketing-peer-sections";
import type { PeerCompletedOutcomeViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { PeerColleagueSection } from "./ui/PeerColleaguePrimitives";
import { CompletedOutcomeTimeline } from "./ui/CompletedOutcomeCard";
import { DoneEmptyState } from "./ui/EmptyColleagueState";

export type DoneSectionProps = {
  outcomes: readonly PeerCompletedOutcomeViewModel[];
  copy: PeerWorkspaceCopy;
};

export default function DoneSection({ outcomes, copy }: DoneSectionProps) {
  const groups = groupCompletedOutcomes(outcomes, copy).map((g) => ({
    key: g.key,
    label: g.label,
    items: g.items,
  }));

  if (groups.length === 0) {
    return (
      <PeerColleagueSection testId="mw-section-done-empty">
        <DoneEmptyState copy={copy} />
      </PeerColleagueSection>
    );
  }

  return (
    <PeerColleagueSection purpose={copy.doneSectionPurpose} testId="mw-section-done">
      <CompletedOutcomeTimeline groups={groups} copy={copy} />
    </PeerColleagueSection>
  );
}
