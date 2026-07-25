"use client";

import Link from "next/link";
import type { IntegrationConnection } from "@/lib/integrations/types";
import type { ResolvedPerformanceMetric } from "@/lib/metrics/resolve-peer-performance";
import MwModal from "./MwModal";

function statusLabel(status: IntegrationConnection["status"]): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "needs_reconnect":
      return "Reconnect required";
    default:
      return "Not connected";
  }
}

function metricsForProvider(
  providerId: string,
  metrics: ResolvedPerformanceMetric[]
): ResolvedPerformanceMetric[] {
  const key = providerId.replace(/_/g, " ");
  return metrics.filter(
    (m) =>
      m.label.toLowerCase().includes(providerId.replace(/_/g, "")) ||
      m.label.toLowerCase().includes(key.split(" ")[0] ?? "")
  );
}

export type MwChannelDetailModalProps = {
  open: boolean;
  onClose: () => void;
  channel: IntegrationConnection | null;
  metrics: ResolvedPerformanceMetric[];
};

export default function MwChannelDetailModal({
  open,
  onClose,
  channel,
  metrics,
}: MwChannelDetailModalProps) {
  if (!channel) return null;

  const scoped = metricsForProvider(channel.id, metrics);
  const syncLabel = channel.lastSyncedAt
    ? new Date(channel.lastSyncedAt).toLocaleString()
    : "—";

  return (
    <MwModal
      open={open}
      onClose={onClose}
      title={channel.label}
      subtitle="Channel connection and scoped metrics"
      maxWidth={480}
    >
      <div className="mw-channel-detail">
        <div className="mw-channel-detail-row">
          <span className="mw-channel-detail-label">Status</span>
          <span
            className={`mw-channel-status${
              channel.status === "connected"
                ? " mw-channel-status--ok"
                : channel.status === "needs_reconnect"
                  ? " mw-channel-status--warn"
                  : ""
            }`}
          >
            {statusLabel(channel.status)}
          </span>
        </div>
        <div className="mw-channel-detail-row">
          <span className="mw-channel-detail-label">Last successful sync</span>
          <span>{syncLabel}</span>
        </div>
        {channel.status === "needs_reconnect" && (
          <p className="mw-empty-inline" style={{ marginTop: 12 }}>
            Your connection expired. Reconnect to resume sync and publishing.
          </p>
        )}
        <div className="mw-channel-metrics">
          <div className="mw-modal-label">Metrics</div>
          {scoped.length === 0 ? (
            <p className="mw-empty-inline">No metrics available for this channel yet.</p>
          ) : (
            <ul className="mw-channel-metric-list">
              {scoped.map((m) => (
                <li key={m.id}>
                  <span>{m.label}</span>
                  <strong>{m.value}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link
          href={channel.settingsHref}
          className="mw-btn-primary mw-btn-primary--full pg-focus-premium"
          style={{ display: "inline-flex", justifyContent: "center", marginTop: 20 }}
        >
          Manage connection
        </Link>
      </div>
    </MwModal>
  );
}
