"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { PeerRow } from "@/lib/peer-display";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { buildV17MarketingPeerShellModel } from "@/lib/customer-v17/build-v17-marketing-peer-shell";
import V17PeerWorkspace from "@/features/customer-v17/peer/V17PeerWorkspace";
import "@/features/customer-v17/styles/v17-customer.css";

export type MarketingWorkspaceLayoutProps = {
  peer: PeerRow;
  domainInput: MarketingPeerDomainInput;
  onMessage?: () => void;
  onPause?: () => void;
  pauseDisabled?: boolean;
  children: ReactNode;
};

export default function MarketingWorkspaceLayout({
  peer,
  domainInput,
  onMessage,
  onPause,
  pauseDisabled,
  children,
}: MarketingWorkspaceLayoutProps) {
  const pathname = usePathname();
  const shell = buildV17MarketingPeerShellModel({
    peer,
    domainInput,
    pathname,
    localePreference: customerLocalePreferenceFromEnv(),
    pauseDisabled,
  });

  return (
    <div className="v17-page-shell" data-testid="mw-marketing-workspace">
      <V17PeerWorkspace shell={shell} onAssign={onMessage} onPause={onPause}>
        {children}
      </V17PeerWorkspace>
    </div>
  );
}
