"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { getRoleConfig } from "@/lib/peer-display";
import type { CustomerPeerPresenceViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import { SectionAction } from "./ui/PeerColleaguePrimitives";

export type PeerWorkspacePresenceHeaderProps = {
  peerName: string;
  peerRole: string;
  presence: CustomerPeerPresenceViewModel;
};

function avatarPresence(
  key: CustomerPeerPresenceViewModel["presentationKey"]
): "live" | "idle" | undefined {
  if (key === "working" || key === "preparing") return "live";
  if (key === "waiting_for_you") return "idle";
  return undefined;
}

function pillClass(state: CustomerPeerPresenceViewModel["state"]): string {
  switch (state) {
    case "waiting_for_you":
      return "mw-cc-presence-pill--waiting";
    case "working":
      return "mw-cc-presence-pill--working";
    case "preparing":
      return "mw-cc-presence-pill--preparing";
    case "blocked":
      return "mw-cc-presence-pill--blocked";
    case "needs_help":
      return "mw-cc-presence-pill--help";
    default:
      return "mw-cc-presence-pill--calm";
  }
}

export default function PeerWorkspacePresenceHeader({
  peerName,
  peerRole,
  presence,
}: PeerWorkspacePresenceHeaderProps) {
  const roleConfig = getRoleConfig(peerRole);

  return (
    <header className="mw-cc-presence" data-testid="mw-peer-workspace-presence">
      <div className="mw-cc-presence-row">
        <Avatar
          name={peerName}
          gradient={roleConfig.gradient}
          size="md"
          presence={avatarPresence(presence.presentationKey)}
        />
        <div className="mw-cc-presence-main">
          <div className="mw-cc-presence-title-row">
            <div>
              <p className="mw-cc-presence-name">{peerName}</p>
              <p className="mw-cc-presence-role">{roleConfig.roleLabel}</p>
            </div>
            <span
              className={`mw-cc-presence-pill ${pillClass(presence.state)}`}
              role="status"
            >
              {presence.stateLabel}
            </span>
          </div>
          <p className="mw-cc-presence-narrative mw-clamp-2">{presence.narrative}</p>
          {presence.lastMeaningfulUpdateLabel ? (
            <p className="mw-cc-presence-meta">{presence.lastMeaningfulUpdateLabel}</p>
          ) : null}
        </div>
      </div>
      {presence.primaryActionHref && presence.primaryActionLabel ? (
        <div className="mw-cc-presence-actions">
          <SectionAction
            href={presence.primaryActionHref}
            label={presence.primaryActionLabel}
          />
        </div>
      ) : null}
    </header>
  );
}
