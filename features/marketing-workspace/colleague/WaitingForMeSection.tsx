"use client";

import type { PeerAttentionItemViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { PeerColleagueSection } from "./ui/PeerColleaguePrimitives";
import { DecisionCardList } from "./ui/DecisionCard";
import { WaitingEmptyState } from "./ui/EmptyColleagueState";

export type WaitingForMeSectionProps = {
  items: readonly PeerAttentionItemViewModel[];
  copy: PeerWorkspaceCopy;
};

export default function WaitingForMeSection({ items, copy }: WaitingForMeSectionProps) {
  if (items.length === 0) {
    return (
      <PeerColleagueSection testId="mw-section-waiting">
        <WaitingEmptyState copy={copy} />
      </PeerColleagueSection>
    );
  }

  return (
    <PeerColleagueSection purpose={copy.waitingSectionPurpose} testId="mw-section-waiting">
      <DecisionCardList items={items} />
    </PeerColleagueSection>
  );
}
