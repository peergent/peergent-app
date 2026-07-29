"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MARKETING_PEER_SECTIONS,
  resolveActiveMarketingPeerCustomerSection,
  type MarketingPeerCustomerSectionId,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-sections";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";

export type PeerPrimaryNavigationProps = {
  peerId: string;
  activeSection?: MarketingPeerCustomerSectionId;
  copy: PeerWorkspaceCopy;
  waitingCount: number;
};

const LABELS: Record<MarketingPeerCustomerSectionId, keyof PeerWorkspaceCopy> = {
  today: "navToday",
  work: "navWork",
  results: "navResults",
  settings: "navSettings",
};

export default function PeerPrimaryNavigation({
  peerId,
  activeSection,
  copy,
  waitingCount,
}: PeerPrimaryNavigationProps) {
  const pathname = usePathname();
  const current = activeSection ?? resolveActiveMarketingPeerCustomerSection(pathname, peerId);

  return (
    <nav className="mw-tabs mw-peer-section-nav" aria-label="Marketing Peer">
      {MARKETING_PEER_SECTIONS.map((section) => {
        const href = section.href(peerId);
        const isActive = section.id === current;
        const label = copy[LABELS[section.id]];
        const badge = section.id === "today" && waitingCount > 0 ? waitingCount : null;
        return (
          <Link
            key={section.id}
            href={href}
            className={`mw-tab pg-focus-premium${isActive ? " mw-tab--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            data-testid={`mw-section-${section.id}`}
          >
            <span>{label}</span>
            {badge != null && (
              <span className="mw-count-badge" aria-label={`${badge} waiting`}>
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
