"use client";

import { useCallback, useEffect, useId, useState, type CSSProperties } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Bot, ChevronDown, Users } from "lucide-react";
import type { HomeCopy } from "@/lib/i18n";
import type { HomeViewModel } from "@/lib/home";
import type { FigmaPeerCard } from "./figma-port-data";
import type { PeerColleagueView } from "./figma-port-peer-detail";
import { buildAllPeerColleagueViews } from "./figma-port-peer-detail";
import PeerLiveIndicator from "./PeerLiveIndicator";

const HEAD = "'Space Grotesk', system-ui, sans-serif";

type CurrentlyWorkingPeersProps = {
  peers: FigmaPeerCard[];
  viewModel: HomeViewModel;
  copy: HomeCopy;
  activeCount: number;
  activeBadge: string;
  formatTime: (iso: string) => string;
};

function PeerAvatar({
  peer,
}: {
  peer: FigmaPeerCard;
}) {
  const alive = peer.statusKind === "working";

  return (
    <div
      className={`peer-avatar-wrap peer-avatar-wrap--${peer.statusKind}${alive ? " is-glowing" : ""}`}
      style={{ "--peer-accent": peer.color, "--peer-accent-soft": peer.bg } as CSSProperties}
    >
      <div
        className={alive ? "breathing peer-avatar" : "peer-avatar"}
        style={
          {
            background: peer.bg,
            color: peer.color,
            "--glow": `${peer.color}38`,
            animationDelay: `${peer.delay}s`,
          } as CSSProperties
        }
      >
        <peer.Icon size={14} strokeWidth={1.8} style={{ color: peer.color }} />
      </div>
      {alive && <span className="peer-avatar-pulse" aria-hidden />}
    </div>
  );
}

function ColleagueLivePanel({
  view,
  peer,
}: {
  view: PeerColleagueView;
  peer: FigmaPeerCard;
}) {
  return (
    <div
      className={`peer-colleague-live peer-colleague-live--${peer.statusKind}`}
      style={{ "--peer-accent": peer.color, "--peer-accent-soft": peer.bg } as CSSProperties}
    >
      <div className="peer-colleague-live-inner">
        <div className="peer-colleague-live-top">
          <PeerLiveIndicator statusKind={peer.statusKind} color={peer.color} delay={peer.delay} />
          <p className="peer-colleague-live-label">{view.liveStatus.headline}</p>
        </div>
        <p className="peer-colleague-live-action">{view.liveStatus.action}</p>
        {view.liveStatus.timestampLabel && (
          <p className="peer-colleague-live-time">{view.liveStatus.timestampLabel}</p>
        )}
      </div>
    </div>
  );
}

function ColleagueExpandedPanel({
  view,
  peer,
}: {
  view: PeerColleagueView;
  peer: FigmaPeerCard;
}) {
  return (
    <div className="peer-colleague-expand">
      <ColleagueLivePanel view={view} peer={peer} />

      {view.currentWork && (
        <section className="peer-colleague-block">
          <p className="peer-colleague-block-label">Current work</p>
          {view.currentWork.title && (
            <p className="peer-colleague-work-title">{view.currentWork.title}</p>
          )}
          {view.currentWork.detail && (
            <p className="peer-colleague-work-detail">{view.currentWork.detail}</p>
          )}
          {view.currentWork.metadata.length > 0 && (
            <ul className="peer-colleague-meta">
              {view.currentWork.metadata.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {view.recentActions.length > 0 && (
        <section className="peer-colleague-block">
          <p className="peer-colleague-block-label">Recent actions</p>
          <ol className="peer-colleague-timeline">
            {view.recentActions.map((action, index) => (
              <li key={`${action.title}-${action.time}`} className="peer-colleague-timeline-item">
                <div className="peer-colleague-timeline-rail" aria-hidden>
                  <span
                    className={`peer-colleague-timeline-dot${index === 0 ? " is-latest" : ""}`}
                    style={{ background: peer.color }}
                  />
                  {index < view.recentActions.length - 1 && (
                    <span className="peer-colleague-timeline-line" />
                  )}
                </div>
                <Link href={action.href} className="peer-colleague-timeline-link pg-focus-premium">
                  <span className="peer-colleague-timeline-title">{action.title}</span>
                  <span className="peer-colleague-timeline-time">{action.time}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {view.attention.length > 0 && (
        <section className="peer-colleague-block">
          <p className="peer-colleague-block-label">Requires attention</p>
          <ul className="peer-colleague-attention-list">
            {view.attention.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={`peer-colleague-attention-card pg-focus-premium${item.urgent ? " is-urgent" : ""}`}
                  style={{ "--peer-accent-soft": peer.bg } as CSSProperties}
                >
                  <p className="peer-colleague-attention-status">{item.status}</p>
                  <p className="peer-colleague-attention-title">{item.title}</p>
                  {item.context && (
                    <p className="peer-colleague-attention-context">{item.context}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {view.nextStep && (
        <section className="peer-colleague-block peer-colleague-block--next">
          <p className="peer-colleague-block-label">Next step</p>
          <Link
            href={view.nextStep.href}
            className="peer-colleague-next-cta pg-focus-premium"
            style={{ "--peer-accent": peer.color, "--peer-accent-soft": peer.bg } as CSSProperties}
          >
            <span>{view.nextStep.label}</span>
            <ArrowRight size={12} aria-hidden />
          </Link>
        </section>
      )}
    </div>
  );
}

function PeerWorkingCard({
  peer,
  view,
  expanded,
  onToggle,
  openWorkspaceLabel,
  panelId,
  index,
}: {
  peer: FigmaPeerCard;
  view: PeerColleagueView;
  expanded: boolean;
  onToggle: () => void;
  openWorkspaceLabel: string;
  panelId: string;
  index: number;
}) {
  const alive =
    peer.statusKind === "working" ||
    peer.statusKind === "waiting" ||
    peer.statusKind === "blocked";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: 0.08 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`premium-card peer-colleague-card${alive ? " is-alive" : ""}${expanded ? " is-expanded" : ""}`}
      style={{ "--peer-accent": peer.color, "--peer-accent-soft": peer.bg } as CSSProperties}
    >
      <div className="peer-card">
        <div className="peer-card-header">
          <PeerAvatar peer={peer} />
          <div className="peer-card-names">
            <div className="peer-card-name-row">
              <p className="peer-card-name">{peer.name}</p>
              {!expanded && (
                <PeerLiveIndicator
                  statusKind={peer.statusKind}
                  color={peer.color}
                  delay={peer.delay}
                />
              )}
            </div>
            <p className="peer-card-role">{peer.dept}</p>
          </div>
        </div>

        {!expanded && (
          <>
            <p className="peer-card-action">{peer.currentAction}</p>
            {peer.statusChip && (
              <span className={`peer-status-chip peer-status-chip--${peer.statusKind}`}>
                {peer.statusChip}
              </span>
            )}
          </>
        )}

        <div className="peer-card-actions">
          <Link
            href={peer.href}
            className="btn-outline peer-card-workspace pg-focus-premium"
          >
            {openWorkspaceLabel}
            <ArrowRight size={9} aria-hidden />
          </Link>
          <button
            type="button"
            className="peer-expand-toggle pg-focus-premium"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={
              expanded
                ? `Collapse ${peer.name} colleague view`
                : `Expand ${peer.name} colleague view`
            }
            onClick={onToggle}
          >
            <ChevronDown size={12} className="peer-expand-chevron" data-expanded={expanded} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-label={`${peer.name} live colleague view`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="peer-expand-shell"
          >
            <ColleagueExpandedPanel view={view} peer={peer} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function CurrentlyWorkingPeers({
  peers,
  viewModel,
  copy,
  activeCount,
  activeBadge,
  formatTime,
}: CurrentlyWorkingPeersProps) {
  const baseId = useId();
  const [expandedPeerId, setExpandedPeerId] = useState<string | null>(null);

  const views = buildAllPeerColleagueViews(
    viewModel.teamPulse,
    viewModel,
    copy,
    formatTime
  );

  const togglePeer = useCallback((peerId: string) => {
    setExpandedPeerId((current) => (current === peerId ? null : peerId));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && expandedPeerId) {
        setExpandedPeerId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedPeerId]);

  if (peers.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: 0.15 }}
      style={{ position: "relative", zIndex: 1 }}
      aria-label={copy.ui.currentlyWorking}
    >
      <div className="peer-section-header">
        <div className="peer-section-title-wrap">
          <div className="peer-section-title">
            <Bot
              size={13}
              strokeWidth={1.8}
              style={{ color: "var(--muted-foreground)", opacity: 0.55, flexShrink: 0 }}
            />
            <p
              style={{
                fontFamily: HEAD,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
              }}
            >
              {copy.ui.currentlyWorking}
            </p>
          </div>
          {activeCount > 0 && (
            <div className="status-alive peer-active-badge">
              <span className="peer-active-dot" aria-hidden />
              {activeBadge}
            </div>
          )}
        </div>
        <Link href="/team" className="btn-outline pg-focus-premium peer-section-link">
          <Users size={13} aria-hidden />
          {copy.ui.seeAllPeers}
          <ArrowRight size={12} aria-hidden />
        </Link>
      </div>

      <div className="figma-peers-grid">
        {peers.map((peer, index) => {
          const panelId = `${baseId}-panel-${peer.peerId}`;
          const view = views.get(peer.peerId);
          if (!view) return null;

          return (
            <PeerWorkingCard
              key={peer.peerId}
              peer={peer}
              view={view}
              expanded={expandedPeerId === peer.peerId}
              onToggle={() => togglePeer(peer.peerId)}
              openWorkspaceLabel={copy.ui.openWorkspace}
              panelId={panelId}
              index={index}
            />
          );
        })}
      </div>
    </motion.section>
  );
}
