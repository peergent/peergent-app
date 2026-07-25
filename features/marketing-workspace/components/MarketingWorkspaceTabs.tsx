"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MARKETING_PEER_TABS,
  resolveActiveMarketingPeerTab,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerTabId } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";

export type MarketingWorkspaceTabsProps = {
  peerId: string;
  activeTab?: MarketingPeerTabId;
};

export default function MarketingWorkspaceTabs({ peerId, activeTab }: MarketingWorkspaceTabsProps) {
  const pathname = usePathname();
  const current = activeTab ?? resolveActiveMarketingPeerTab(pathname, peerId);

  return (
    <nav className="mw-tabs" aria-label="Marketing workspace">
      {MARKETING_PEER_TABS.map((tab) => {
        const href = tab.href(peerId);
        const isActive = tab.id === current;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`mw-tab pg-focus-premium${isActive ? " mw-tab--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            data-testid={`mw-tab-${tab.id}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
