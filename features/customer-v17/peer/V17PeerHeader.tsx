"use client";

import Avatar from "@/components/ui/Avatar";
import { getRoleConfig } from "@/lib/peer-display";
import { getV17CommandCenterCopy } from "@/lib/i18n/v17-command-center-copy";
import { v17PeerAccentClass, v17ServiceKeyFromPeer } from "@/lib/customer-v17/peer-accent";
import type { CustomerPeerPresenceViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";

export type V17PeerHeaderProps = {
  peerName: string;
  peerRole: string;
  presence: CustomerPeerPresenceViewModel;
  localePreference?: string | null;
};

export default function V17PeerHeader({
  peerName,
  peerRole,
  presence,
  localePreference,
}: V17PeerHeaderProps) {
  const roleConfig = getRoleConfig(peerRole);
  const serviceKey = v17ServiceKeyFromPeer({ role: peerRole, name: peerName });
  const copy = getV17CommandCenterCopy(localePreference);

  return (
    <header className={`v17-peer-header ${v17PeerAccentClass(serviceKey)}`} data-testid="v17-peer-header">
      <p className="v17-eyebrow">{copy.peerEyebrow}</p>
      <div className="v17-row-left" style={{ marginBottom: 16, gap: 14 }}>
        <Avatar name={peerName} gradient={roleConfig.gradient} size="md" />
        <div>
          <p className="v17-page-title" style={{ fontSize: 19, margin: 0 }}>
            {peerName}
          </p>
          <p className="v17-status-tag" style={{ textTransform: "uppercase" }}>
            {presence.stateLabel}
          </p>
        </div>
      </div>
      <div className="v17-brief">
        <p className="v17-brief-focus">{presence.narrative}</p>
        {presence.lastMeaningfulUpdateLabel ? (
          <p className="v17-page-support" style={{ margin: 0, fontSize: 12 }}>
            {presence.lastMeaningfulUpdateLabel}
          </p>
        ) : null}
      </div>
    </header>
  );
}
