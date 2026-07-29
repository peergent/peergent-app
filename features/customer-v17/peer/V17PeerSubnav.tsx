"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MARKETING_PEER_SECTIONS,
  resolveActiveMarketingPeerCustomerSection,
  type MarketingPeerCustomerSectionId,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-sections";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";

export type V17PeerSubnavProps = {
  peerId: string;
  copy: PeerWorkspaceCopy;
  waitingCount?: number;
};

const LABELS: Record<MarketingPeerCustomerSectionId, keyof PeerWorkspaceCopy> = {
  today: "navToday",
  work: "navWork",
  results: "navResults",
  settings: "navSettings",
};

export default function V17PeerSubnav({ peerId, copy, waitingCount = 0 }: V17PeerSubnavProps) {
  const pathname = usePathname();
  const current = resolveActiveMarketingPeerCustomerSection(pathname, peerId);

  return (
    <nav className="v17-subnav" aria-label="Peer workspace">
      {MARKETING_PEER_SECTIONS.map((section) => {
        const href = section.href(peerId);
        const isActive = section.id === current;
        const label = copy[LABELS[section.id]];
        return (
          <Link
            key={section.id}
            href={href}
            className={`v17-subnav-link pg-focus-premium${isActive ? " v17-subnav-link--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            data-testid={`mw-section-${section.id}`}
          >
            {label}
            {section.id === "today" && waitingCount > 0 ? ` (${waitingCount})` : null}
          </Link>
        );
      })}
    </nav>
  );
}
