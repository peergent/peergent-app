"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Menu, X } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { useTheme } from "@/components/theme/ThemeProvider";
import { peerAccentVar, type PresenceLine } from "@/lib/design-system/foundation";
import {
  OFFICE_DESTINATION_LIST,
  officeDestinationLabel,
  type OfficeDestinationId,
} from "@/lib/office/destinations";
import {
  DEMO_VISION_ROSTER,
  peerAccentCssVar,
  type VisionRosterPeer,
} from "@/lib/office/vision-roster";
import DemoResetControl from "@/features/office/demo/DemoResetControl";

function canvasLayoutClass(active?: OfficeDestinationId): string {
  switch (active) {
    case "work":
      return "pg-v13-canvas--workspace";
    case "performance":
    case "content":
    case "market":
      return "pg-v13-canvas--dashboard";
    case "agreement":
      return "pg-v13-canvas--settings";
    case "desk":
    default:
      return "pg-v13-canvas--narrative";
  }
}

export type VisionShellPeer = {
  id: string;
  name: string;
  role: string;
};

export type PgVisionShellProps = {
  mode: "iedereen" | "peer";
  locale?: string | null;
  /** Active peer when mode=peer */
  peerId?: string;
  peerName?: string;
  peerRole?: string;
  active?: OfficeDestinationId;
  presence?: PresenceLine | null;
  decisionCount?: number;
  isDemo?: boolean;
  roster?: readonly VisionRosterPeer[];
  onAsk?: () => void;
  onNewCampaign?: () => void;
  children: ReactNode;
};

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={13} height={13} aria-hidden>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth={2} />
      <path
        d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={13} height={13} aria-hidden>
      <path
        d="M21 12.5A8.5 8.5 0 1111.5 3 7 7 0 0021 12.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeergentMark() {
  return (
    <div className="pg-v13-mark" aria-hidden>
      <svg viewBox="0 0 26 26" fill="none" className="h-full w-full p-1">
        <path
          d="M8 5v16M8 5c5 0 8 1.5 8 5.5S13 16 8 16"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const SHELL_COPY = {
  en: {
    overview: "Overview",
    peers: "Peers",
    everyone: "Everyone",
    you: "You",
    ask: "Ask me anything",
    peerEyebrow: "Peer",
    newCampaign: "+ New campaign",
    demo: "Demo workspace",
  },
  nl: {
    overview: "Overzicht",
    peers: "Peers",
    everyone: "Iedereen",
    you: "Jij",
    ask: "Vraag me iets",
    peerEyebrow: "Peer",
    newCampaign: "+ Nieuwe campagne",
    demo: "Demo-werkruimte",
  },
} as const;

export default function PgVisionShell({
  mode,
  locale,
  peerId = "",
  peerName = "",
  peerRole = "Marketing",
  active = "desk",
  presence = null,
  decisionCount = 0,
  isDemo = false,
  roster = [],
  onAsk,
  onNewCampaign,
  children,
}: PgVisionShellProps) {
  const pathname = usePathname();
  const { resolved, setPreference } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const copy = locale === "nl" ? SHELL_COPY.nl : SHELL_COPY.en;
  const peerAccent = peerAccentCssVar(peerRole);
  const isIedereen = mode === "iedereen" || pathname === "/home";

  const rail = (
    <>
      <button
        type="button"
        className="pg-v13-collapse-btn hidden lg:flex"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft size={11} aria-hidden />
      </button>

      <div className="pg-v13-brand">
        <PeergentMark />
        <span className="pg-v13-brand-word">Peergent</span>
      </div>

      <div className="pg-v13-theme-toggle">
        <button
          type="button"
          aria-label="Light theme"
          aria-pressed={resolved === "light"}
          onClick={() => setPreference("light")}
        >
          <SunIcon />
        </button>
        <button
          type="button"
          aria-label="Dark theme"
          aria-pressed={resolved === "dark"}
          onClick={() => setPreference("dark")}
        >
          <MoonIcon />
        </button>
      </div>

      <div className="pg-v13-nav-group">
        <div className="pg-v13-rail-label">{copy.overview}</div>
        <Link
          href="/home"
          className={cn("pg-v13-r-chip", isIedereen && "pg-v13-r-chip--active")}
          aria-current={isIedereen ? "page" : undefined}
        >
          <span
            className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
            style={{ background: "var(--pg-v13-grad)" }}
            aria-hidden
          >
            ✺
          </span>
          <span className="pg-v13-r-chip-name">{copy.everyone}</span>
        </Link>
      </div>

      <div className="pg-v13-nav-group">
        <div className="pg-v13-rail-label pg-v13-rail-label--peers">{copy.peers}</div>
        {roster.map((peer) => {
          const activePeer = mode === "peer" && peerId === peer.id;
          const dotClass =
            peer.state === "working"
              ? "pg-v13-r-dot--working"
              : peer.state === "waiting"
                ? "pg-v13-r-dot--waiting"
                : "pg-v13-r-dot--calm";

          return (
            <Link
              key={peer.id}
              href={peer.href}
              className={cn("pg-v13-r-chip", activePeer && "pg-v13-r-chip--active")}
              aria-current={activePeer ? "page" : undefined}
              style={{ ["--pg-v13-peer" as string]: peerAccentCssVar(peer.role) }}
            >
              <span className={cn("pg-v13-r-dot", dotClass)} aria-hidden />
              <span className="pg-v13-r-chip-name">{peer.name}</span>
              {peer.needsYou ? <span className="pg-v13-r-flag" aria-hidden /> : null}
            </Link>
          );
        })}
      </div>

      {isDemo ? (
        <p className="pg-v13-rail-label text-[10px] normal-case tracking-normal">{copy.demo}</p>
      ) : null}

      <div className="pg-v13-rail-foot">
        <button type="button" className="pg-v13-ask pg-focus-premium w-full" onClick={onAsk}>
          <span className="pg-v13-ask-label truncate">{copy.ask}</span>
          <kbd>⌘K</kbd>
        </button>
        <div className="pg-v13-you-row">
          <div className="pg-v13-you-avatar" aria-hidden />
          <span className="pg-v13-you-name">{copy.you}</span>
        </div>
        {isDemo ? <DemoResetControl locale={locale} /> : null}
      </div>
    </>
  );

  const subnav =
    mode === "peer" ? (
      <div className="pg-v13-subnav" style={{ ["--pg-v13-peer" as string]: peerAccent }}>
        <nav className="pg-v13-subnav-tabs" aria-label="Peer sections">
          {OFFICE_DESTINATION_LIST.map((destination) => {
            const label =
              destination.id === "performance"
                ? locale === "nl"
                  ? "Resultaten"
                  : "Results"
                : destination.id === "agreement"
                  ? locale === "nl"
                    ? "Instellingen"
                    : "Settings"
                  : officeDestinationLabel(destination, locale);

            return (
              <Link
                key={destination.id}
                href={destination.href(peerId)}
                aria-current={destination.id === active ? "page" : undefined}
                data-testid={`pg-tab-${destination.id}`}
              >
                {label}
                {destination.badged && decisionCount > 0 ? ` (${decisionCount})` : ""}
              </Link>
            );
          })}
        </nav>
        {onNewCampaign ? (
          <button type="button" className="pg-v13-subnav-cta" onClick={onNewCampaign}>
            {copy.newCampaign}
          </button>
        ) : null}
      </div>
    ) : null;

  const briefing =
    mode === "peer" && presence?.text ? (
      <div className="pg-v13-brief" style={{ ["--pg-v13-peer" as string]: peerAccent }}>
        <div className="pg-v13-brief-tag">
          <span className="pg-v13-dot" aria-hidden />
          {peerRole} Peer
        </div>
        <p>{presence.text}</p>
        {presence.timeLabel ? <div className="pg-v13-when">{presence.timeLabel}</div> : null}
      </div>
    ) : null;

  return (
    <div className="pg-vision pg-v13-font pg-v13-scene pg-office-canvas">
      <div className="pg-v13-app">
        <aside
          className={cn(
            "pg-v13-rail hidden lg:flex",
            collapsed && "pg-v13-rail--collapsed"
          )}
          aria-label="Application"
        >
          {rail}
        </aside>

        <div className="pg-v13-main flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-[var(--pg-v13-line-soft)] px-4 py-3 lg:hidden">
            <PeergentMark />
            <span className="pg-v13-brand-word flex-1">Peergent</span>
            <button
              type="button"
              className="pg-focus-premium inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pg-v13-line-soft)]"
              onClick={() => setMobileNav((open) => !open)}
              aria-expanded={mobileNav}
            >
              {mobileNav ? <X size={16} /> : <Menu size={16} />}
            </button>
          </header>

          {mobileNav ? (
            <div className="border-b border-[var(--pg-v13-line-soft)] px-4 py-4 lg:hidden">{rail}</div>
          ) : null}

          <div
            className={cn(
              "pg-v13-canvas pg-voice-enter flex-1",
              mode === "peer" && canvasLayoutClass(active),
              isIedereen && "pg-v13-canvas--dashboard"
            )}
          >
            {mode === "peer" ? (
              <>
                <p className="pg-v13-eyebrow">{copy.peerEyebrow}</p>
                {briefing}
                {subnav}
              </>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
