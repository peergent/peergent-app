"use client";

import Link from "next/link";
import type { EmmaConnectedChannelsViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import EmmaCard from "../components/EmmaCard";
import EmmaWorkspaceSection from "../components/EmmaWorkspaceSection";

export type EmmaConnectedChannelsProps = {
  model: EmmaConnectedChannelsViewModel;
};

function statusLabel(status: EmmaConnectedChannelsViewModel["channels"][number]["status"]): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "needs_reconnect":
      return "Needs reconnect";
    default:
      return "Not connected";
  }
}

export default function EmmaConnectedChannels({ model }: EmmaConnectedChannelsProps) {
  return (
    <EmmaWorkspaceSection title="Connected Channels" className="emma-workspace-section--compact">
      <EmmaCard className="emma-connected-channels">
        <ul className="emma-connected-channels__list">
          {model.channels.map((channel) => (
            <li key={channel.id}>
              <Link
                href={channel.settingsHref}
                className="emma-connected-channels__item pg-focus-premium"
              >
                <div className="emma-connected-channels__main">
                  <span className="emma-connected-channels__label">{channel.label}</span>
                  {channel.accountName && (
                    <span className="emma-connected-channels__account">{channel.accountName}</span>
                  )}
                </div>
                <div className="emma-connected-channels__meta">
                  <span
                    className={`emma-connected-channels__status emma-connected-channels__status--${channel.status}`}
                  >
                    {statusLabel(channel.status)}
                  </span>
                  {channel.lastSyncedLabel && (
                    <span className="emma-connected-channels__sync">
                      Last sync: {channel.lastSyncedLabel}
                    </span>
                  )}
                  {channel.status === "connected" && (
                    <span className="emma-connected-channels__perms">
                      {channel.publishEnabled ? "Publish on" : "Publish off"} ·{" "}
                      {channel.analyticsEnabled ? "Analytics on" : "Analytics off"}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </EmmaCard>
    </EmmaWorkspaceSection>
  );
}
