"use client";

import type { PeerWorkingOnViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { PeerColleagueSection } from "./ui/PeerColleaguePrimitives";
import { CurrentFocusCard, NextWorkList } from "./ui/CurrentFocusCard";

export type WorkingOnSectionProps = {
  model: PeerWorkingOnViewModel;
  copy: PeerWorkspaceCopy;
};

export default function WorkingOnSection({ model, copy }: WorkingOnSectionProps) {
  return (
    <PeerColleagueSection testId="mw-section-working-on">
      <CurrentFocusCard model={model} copy={copy} />
      {model.mode === "focus" ? (
        <NextWorkList
          items={model.upcoming}
          sectionLabel={copy.workingOnUpcoming}
          openLabel={copy.openCampaign}
        />
      ) : null}
    </PeerColleagueSection>
  );
}
