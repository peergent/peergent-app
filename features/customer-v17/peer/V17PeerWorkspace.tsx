"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { getRoleConfig } from "@/lib/peer-display";
import { v17PeerAccentClass, v17ServiceKeyFromPeer } from "@/lib/customer-v17/peer-accent";
import type { V17MarketingPeerShellModel } from "@/lib/customer-v17/build-v17-marketing-peer-shell";

export type V17PeerWorkspaceProps = {
  shell: V17MarketingPeerShellModel;
  onAssign?: () => void;
  onPause?: () => void;
  children: ReactNode;
};

export default function V17PeerWorkspace({ shell, onAssign, onPause, children }: V17PeerWorkspaceProps) {
  const pathname = usePathname();
  const serviceKey = v17ServiceKeyFromPeer({ role: shell.peerRole, name: shell.peerName });
  const roleConfig = getRoleConfig(shell.peerRole);
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { id: "today" as const, label: shell.peerCopy.navToday, href: `/team/${shell.peerId}` },
    { id: "work" as const, label: shell.peerCopy.navWork, href: `/team/${shell.peerId}/work` },
    { id: "results" as const, label: shell.peerCopy.navResults, href: `/team/${shell.peerId}/results` },
    { id: "settings" as const, label: shell.peerCopy.navSettings, href: `/team/${shell.peerId}/settings` },
  ];

  return (
    <div className="v17-peer-page" data-testid="v17-peer-workspace">
      <p className="v17-eyebrow">{shell.peerCopy.peerEyebrow}</p>
      <div className="v17-peer-top">
        <div className={`v17-avatar ${shell.presentationKey === "working" ? "v17-avatar--working" : ""}`}>
          <Avatar name={shell.peerName} gradient={roleConfig.gradient} size="md" />
        </div>
        <div className="v17-peer-meta">
          <div className="v17-peer-name">{shell.peerName}</div>
          <div className="v17-peer-status">{shell.statusLabel}</div>
        </div>
        {(onAssign || onPause) && (
          <div className="v17-peer-actions">
            <button
              type="button"
              className="v17-icon-btn pg-focus-premium"
              aria-label="Peer actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen ? (
              <div className="v17-peer-menu" role="menu">
                {onAssign ? (
                  <button type="button" role="menuitem" className="v17-peer-menu-item" onClick={onAssign}>
                    {shell.peerCopy.assignWork}
                  </button>
                ) : null}
                {onPause ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="v17-peer-menu-item"
                    disabled={shell.pauseDisabled}
                    onClick={onPause}
                  >
                    {shell.peerCopy.pause}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className={`v17-brief ${v17PeerAccentClass(serviceKey)}`}>
        <div className="v17-brief-tag">
          <span className="v17-dot-peer" aria-hidden />
          {shell.briefing.peerTagLabel}
        </div>
        <p className="v17-brief-focus">{shell.briefing.focusItalic}</p>
        {shell.briefing.supportingLine ?? shell.briefing.metaLine ? (
          <p className="v17-brief-meta">{shell.briefing.supportingLine ?? shell.briefing.metaLine}</p>
        ) : null}
      </div>

      <nav className="v17-subnav" aria-label="Peer sections">
        {tabs.map((tab) => {
          const active =
            shell.activeTab === tab.id ||
            (tab.id === "today" && pathname.startsWith(`/team/${shell.peerId}/waiting`));
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`v17-subnav-link pg-focus-premium${active ? " v17-subnav-link--active" : ""}`}
              aria-current={active ? "page" : undefined}
              data-testid={`mw-section-${tab.id}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="v17-peer-content">{children}</div>
    </div>
  );
}
