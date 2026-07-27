"use client";

import type { ReactNode } from "react";
import Avatar from "@/components/ui/Avatar";
import { getRoleConfig } from "@/lib/peer-display";
import type { PeerPresenceKey } from "../lib/customer-campaign-presenter";

export type MarketingPeerPresenceHeaderProps = {
  peerName: string;
  peerRole?: string;
  campaignTitle: string;
  presenceKey: PeerPresenceKey;
  presenceLabel: string;
  narrative: string;
  primaryAction?: ReactNode;
};

function avatarPresence(key: PeerPresenceKey): "live" | "idle" | undefined {
  switch (key) {
    case "working":
    case "preparing":
    case "thinking":
      return "live";
    case "needs_review":
    case "waiting_for_you":
      return "idle";
    default:
      return undefined;
  }
}

export default function MarketingPeerPresenceHeader({
  peerName,
  peerRole = "Marketing",
  campaignTitle,
  presenceKey,
  presenceLabel,
  narrative,
  primaryAction,
}: MarketingPeerPresenceHeaderProps) {
  const roleConfig = getRoleConfig(peerRole);

  return (
    <header
      className="mw-peer-presence-header pg-animate-in"
      data-testid="mw-peer-presence-header"
    >
      <div className="mw-peer-presence-top">
        <Avatar
          name={peerName}
          gradient={roleConfig.gradient}
          size="md"
          presence={avatarPresence(presenceKey)}
        />
        <div className="mw-peer-presence-meta">
          <p className="mw-peer-presence-name">{peerName}</p>
          <p className="mw-peer-presence-role">{roleConfig.roleLabel}</p>
        </div>
        <span
          className={`mw-peer-presence-pill mw-peer-presence-pill--${presenceKey}`}
          role="status"
        >
          {presenceLabel}
        </span>
      </div>
      <p className="mw-peer-presence-campaign">{campaignTitle}</p>
      <p className="mw-peer-presence-narrative">{narrative}</p>
      {primaryAction ? (
        <div className="mw-peer-presence-action">{primaryAction}</div>
      ) : null}
    </header>
  );
}
