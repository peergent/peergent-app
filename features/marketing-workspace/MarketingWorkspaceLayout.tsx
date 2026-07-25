"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PeerRow } from "@/lib/peer-display";
import type { MarketingPeerTabId } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { buildMarketingWorkspaceShellViewModel } from "./view-model/buildMarketingWorkspaceShellViewModel";
import MarketingAgentHero from "./components/MarketingAgentHero";
import MarketingObjectiveCard from "./components/MarketingObjectiveCard";
import MarketingWorkspaceTabs from "./components/MarketingWorkspaceTabs";
import "./styles/marketing-workspace.css";

export type MarketingWorkspaceLayoutProps = {
  peer: PeerRow;
  domainInput: MarketingPeerDomainInput;
  activeTab: MarketingPeerTabId;
  userInitial: string;
  onMessage?: () => void;
  onPause?: () => void;
  pauseDisabled?: boolean;
  children: ReactNode;
};

export default function MarketingWorkspaceLayout({
  peer,
  domainInput,
  activeTab,
  userInitial,
  onMessage,
  onPause,
  pauseDisabled,
  children,
}: MarketingWorkspaceLayoutProps) {
  const shell = buildMarketingWorkspaceShellViewModel({
    peer,
    domainInput,
    activeTab,
  });

  return (
    <div className="mw-root">
      <div className="mw-page">
        <div className="mw-topbar">
          <div className="mw-topbar-right">
            <div className="mw-status-pill">
              <span className="mw-live-dot" aria-hidden />
              Workforce active
            </div>
            <div className="mw-avatar" aria-hidden>
              {userInitial}
            </div>
          </div>
        </div>

        <nav className="mw-breadcrumb" aria-label="Breadcrumb">
          <Link href={shell.breadcrumbTeamHref}>Team</Link>
          <span className="mw-breadcrumb__sep">/</span>
          <span className="mw-breadcrumb__current">{shell.peerName}</span>
        </nav>

        <MarketingAgentHero
          agent={shell.agent}
          onMessage={onMessage}
          onPause={onPause}
          pauseDisabled={pauseDisabled}
        />
        <MarketingObjectiveCard objective={shell.objective} />
        <MarketingWorkspaceTabs peerId={shell.peerId} activeTab={activeTab} />

        <div className="mw-tab-panel">{children}</div>
      </div>
    </div>
  );
}
