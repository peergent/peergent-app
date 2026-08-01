"use client";

import type { ReactNode } from "react";
import type { PresenceLine } from "@/lib/design-system/foundation";
import type { OfficeDestinationId } from "@/lib/office/destinations";
import { type VisionRosterPeer } from "@/lib/office/vision-roster";
import PgVisionShell from "./PgVisionShell";

export type TeamRailPeer = {
  id: string;
  name: string;
  role: string;
  working: boolean;
  decisionCount: number;
};

export type PgOfficeShellProps = {
  peerId: string;
  locale?: string | null;
  peerName: string;
  peerRole: string;
  team: readonly TeamRailPeer[];
  roster?: readonly VisionRosterPeer[];
  active: OfficeDestinationId;
  presence: PresenceLine | null;
  decisionCount?: number;
  isDemo?: boolean;
  onBrief?: () => void;
  onSearch?: () => void;
  onNewCampaign?: () => void;
  presenceSuspended?: boolean;
  children: ReactNode;
};

/** Vision v13 shell — presentation wrapper around existing Office routes. */
export default function PgOfficeShell({
  peerId,
  locale,
  peerName,
  peerRole,
  roster,
  active,
  presence,
  decisionCount = 0,
  isDemo = false,
  onSearch,
  onNewCampaign,
  presenceSuspended = false,
  children,
}: PgOfficeShellProps) {
  return (
    <PgVisionShell
      mode="peer"
      locale={locale}
      peerId={peerId}
      peerName={peerName}
      peerRole={peerRole}
      active={active}
      presence={presenceSuspended ? null : presence}
      decisionCount={decisionCount}
      isDemo={isDemo}
      roster={roster ?? []}
      onAsk={onSearch}
      onNewCampaign={onNewCampaign}
    >
      {children}
    </PgVisionShell>
  );
}
