"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Globe2, Link2 } from "lucide-react";
import { getIntegrationsHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { resolvePeerPerformance } from "@/lib/metrics/resolve-peer-performance";
import MwChannelDetailModal from "../components/MwChannelDetailModal";
import type { IntegrationConnection } from "@/lib/integrations/types";

function statusClass(status: IntegrationConnection["status"]): string {
  if (status === "connected") return "mw-channel-status mw-channel-status--ok";
  if (status === "needs_reconnect") return "mw-channel-status mw-channel-status--warn";
  return "mw-channel-status";
}

export type ConnectionsTabProps = {
  domainInput: MarketingPeerDomainInput;
};

export default function ConnectionsTab({ domainInput }: ConnectionsTabProps) {
  const performance = useMemo(
    () =>
      resolvePeerPerformance({
        peerId: domainInput.peerId,
        drafts: domainInput.drafts,
        connections: domainInput.connections,
        storedMetrics: domainInput.storedMetrics,
      }),
    [domainInput]
  );

  const [selected, setSelected] = useState<IntegrationConnection | null>(null);

  return (
    <>
      <section className="mw-section" style={{ animationDelay: "0.05s", marginBottom: 0 }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <Link2 size={15} aria-hidden />
            Connected channels
          </div>
          <Link href={getIntegrationsHref()} className="mw-section-link">
            Manage all
          </Link>
        </div>
        <p className="mw-kn-helper" style={{ marginBottom: 16 }}>
          Live integration status for publishing and performance. Credentials stay in secure
          settings — never shown here.
        </p>
        {domainInput.connections.length === 0 ? (
          <p className="mw-empty-inline">
            No channels connected yet.{" "}
            <Link href={getIntegrationsHref()} className="pg-focus-premium">
              Connect integrations →
            </Link>
          </p>
        ) : (
          <div className="mw-channels-grid">
            {domainInput.connections.map((channel) => {
              const metric = performance.metrics.find(
                (m) =>
                  m.source === "integration" &&
                  m.label.toLowerCase().includes(channel.id.replace(/_/g, ""))
              );
              return (
                <div key={channel.id} className="mw-glass mw-channel-card">
                  <div className="mw-channel-card-head">
                    <div className="mw-channel-name">{channel.label}</div>
                    <span className={statusClass(channel.status)}>
                      {channel.status === "connected"
                        ? "Connected"
                        : channel.status === "needs_reconnect"
                          ? "Error"
                          : "Disconnected"}
                    </span>
                  </div>
                  <div className="mw-channel-meta">
                    Last sync:{" "}
                    {channel.lastSyncedAt
                      ? new Date(channel.lastSyncedAt).toLocaleDateString()
                      : "—"}
                  </div>
                  {metric && (
                    <div className="mw-channel-metric">
                      {metric.label}: <strong>{metric.value}</strong>
                    </div>
                  )}
                  <button
                    type="button"
                    className="mw-btn-review pg-focus-premium"
                    style={{ marginTop: 12 }}
                    onClick={() => setSelected(channel)}
                  >
                    Open
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <MwChannelDetailModal
        open={selected != null}
        onClose={() => setSelected(null)}
        channel={selected}
        metrics={performance.metrics}
      />
    </>
  );
}
