"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { peerAccentVar, type PresenceLine } from "@/lib/design-system/foundation";
import {
  OFFICE_DESTINATION_LIST,
  officeDestinationLabel,
  type OfficeDestinationId,
} from "@/lib/office/destinations";
import PgTeamRail, { type TeamRailPeer } from "./PgTeamRail";
import PgPeerMark from "./PgPeerMark";
import PgPresenceLine from "./PgPresenceLine";

/**
 * The office of one Peer.
 *
 * Composed as a workspace rail rather than a stack of horizontal bars. The
 * previous shell put identity, presence, navigation and the primary action in
 * four separate full-width bands, each with its own divider — which is the
 * visual signature of an admin panel, and it pushed the content down while
 * leaving it unanchored.
 *
 * Identity, presence and navigation now live together in one persistent column,
 * so the workspace reads as *Emma's* rather than as page chrome, and the content
 * area gets the full height it needs.
 *
 * Routing and destination order are unchanged.
 */

/** Shell chrome copy. Kept here so no English leaks past a Dutch locale. */
const SHELL_COPY = {
  en: {
    brief: (n: string) => `Brief ${n}`,
    ask: "Ask anything",
    sections: "Sections",
    demo: "Demo workspace",
    demoHint: "Example company · nothing here is your data",
  },
  nl: {
    brief: (n: string) => `${n} briefen`,
    ask: "Vraag me iets",
    sections: "Secties",
    demo: "Demo-werkruimte",
    demoHint: "Voorbeeldbedrijf · dit zijn niet jouw gegevens",
  },
} as const;

export type PgOfficeShellProps = {
  peerId: string;
  /** "nl" switches shell chrome; anything else resolves to English. */
  locale?: string | null;
  peerName: string;
  peerRole: string;
  team: readonly TeamRailPeer[];
  active: OfficeDestinationId;
  presence: PresenceLine | null;
  decisionCount?: number;
  /** Marks the shell as the curated showcase rather than a real workspace. */
  isDemo?: boolean;
  onBrief?: () => void;
  onSearch?: () => void;
  presenceSuspended?: boolean;
  children: ReactNode;
};

export default function PgOfficeShell({
  peerId,
  locale,
  peerName,
  peerRole,
  team,
  active,
  presence,
  decisionCount = 0,
  isDemo = false,
  onBrief,
  onSearch,
  presenceSuspended = false,
  children,
}: PgOfficeShellProps) {
  const accent = peerAccentVar(peerRole);
  const [navOpen, setNavOpen] = useState(false);
  const copy = locale === "nl" ? SHELL_COPY.nl : SHELL_COPY.en;

  const nav = (
    <nav aria-label="Peer sections" className="flex flex-col gap-0.5">
      {OFFICE_DESTINATION_LIST.map((destination) => {
        const isActive = destination.id === active;
        const showBadge = destination.badged && decisionCount > 0;

        return (
          <Link
            key={destination.id}
            href={destination.href(peerId)}
            aria-current={isActive ? "page" : undefined}
            onClick={() => setNavOpen(false)}
            className={cn(
              "pg-focus-premium group relative flex items-center gap-2.5",
              "rounded-[var(--pg-radius-sm)] py-[7px] pr-2.5 pl-3 text-[13.5px]",
              "transition-colors duration-[var(--pg-duration-state)]",
              isActive
                ? "bg-[var(--pg-office-panel)] font-medium text-[var(--pg-color-text-primary)]"
                : "text-[var(--pg-color-text-tertiary)] hover:bg-[var(--pg-office-panel)]/55 hover:text-[var(--pg-color-text-secondary)]"
            )}
            data-testid={`pg-tab-${destination.id}`}
          >
            {/* The active marker is a short accent bar rather than a filled
                block — it points at the destination instead of shouting. */}
            <span
              className={cn(
                "absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-full",
                "transition-opacity duration-[var(--pg-duration-state)]",
                isActive ? "opacity-100" : "opacity-0"
              )}
              style={{ background: accent }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">
              {officeDestinationLabel(destination, locale)}
            </span>
            {showBadge ? (
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums"
                style={{
                  background: "var(--pg-color-decision-soft)",
                  color: "var(--pg-color-decision)",
                }}
                aria-label={`${decisionCount} waiting for you`}
              >
                {decisionCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const identity = (
    <div className="flex flex-col gap-[var(--pg-space-4)]">
      <div className="flex items-center gap-3">
        <PgPeerMark accent={accent} size={44} working={presence?.working} />
        <div className="min-w-0">
          <p className="truncate text-[16.5px] leading-tight font-semibold text-[var(--pg-color-text-primary)]">
            {peerName}
          </p>
          {/* Role appears here and nowhere else. */}
          <p className="mt-0.5 truncate text-[11.5px] text-[var(--pg-color-text-tertiary)]">
            {peerRole}
          </p>
        </div>
      </div>

      {isDemo ? (
        // Never let a showcase be mistaken for the customer's own numbers. This
        // is stated once, plainly, where identity is established — not repeated
        // as a banner on every page.
        <div
          className={cn(
            "flex flex-col gap-0.5 rounded-[var(--pg-radius-sm)]",
            "border border-dashed border-[var(--pg-office-line-strong)]",
            "px-[var(--pg-space-3)] py-[var(--pg-space-2)]"
          )}
          data-testid="pg-demo-badge"
        >
          <span className="text-[10px] font-medium tracking-[0.09em] text-[var(--pg-color-text-secondary)] uppercase">
            {copy.demo}
          </span>
          <span className="text-[11px] leading-snug text-[var(--pg-color-text-tertiary)]">
            {copy.demoHint}
          </span>
        </div>
      ) : null}

      {/* Presence belongs to her identity, not to the page. */}
      <PgPresenceLine
        line={presence}
        accentVar={accent}
        suspended={presenceSuspended}
        locale={locale}
        variant="rail"
        testId="pg-presence-line"
      />
    </div>
  );

  return (
    <div
      // Full viewport by default; a host that already owns the height (the dev
      // harness) can hand down its own via --pg-shell-min-h.
      className="flex min-h-[var(--pg-shell-min-h,100vh)] flex-1 pg-office-canvas"
    >
      <PgTeamRail peers={team} activePeerId={peerId} />

      {/* ---- Workspace rail: identity · presence · navigation · action ---- */}
      <div
        className={cn(
          "hidden w-[248px] shrink-0 flex-col gap-[var(--pg-space-5)] lg:flex",
          "border-r border-[var(--pg-office-line)] bg-[var(--pg-office-chrome)]",
          "px-[var(--pg-space-4)] py-[var(--pg-space-5)]"
        )}
      >
        {identity}
        {nav}

        {/* Actions settle at the foot of the rail, so the rail reads as a
            column with a top and a bottom rather than a top-packed list. */}
        <div className="mt-auto flex flex-col gap-2 border-t border-[var(--pg-office-line)] pt-[var(--pg-space-4)]">
          {onBrief ? (
            <button
              type="button"
              onClick={onBrief}
              className={cn(
                "pg-focus-premium inline-flex min-h-9 items-center justify-center",
                "rounded-[var(--pg-radius-sm)] text-[13.5px] font-medium",
                "transition-transform duration-[var(--pg-duration-state)]",
                "hover:-translate-y-px active:translate-y-0"
              )}
              style={{
                background: `color-mix(in srgb, ${accent} 16%, var(--pg-office-panel))`,
                color: accent,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 34%, transparent)`,
              }}
              data-testid="pg-brief-action"
            >
              {copy.brief(peerName.split(" ")[0])}
            </button>
          ) : null}
          {onSearch ? (
            <button
              type="button"
              onClick={onSearch}
              className={cn(
                "pg-focus-premium inline-flex items-center justify-center gap-2",
                "rounded-[var(--pg-radius-sm)] py-1.5 text-[12.5px]",
                "text-[var(--pg-color-text-tertiary)]",
                "transition-colors duration-[var(--pg-duration-state)]",
                "hover:text-[var(--pg-color-text-secondary)]"
              )}
            >
              <Search size={13} aria-hidden />
              {copy.ask}
              <span className="tabular-nums opacity-60">⌘K</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* ---- Content ------------------------------------------------------ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact bar on narrow screens only, so small viewports keep the
            same identity without the rail eating the width. */}
        <header
          className={cn(
            "flex shrink-0 items-center gap-3 lg:hidden",
            "border-b border-[var(--pg-office-line)] bg-[var(--pg-office-chrome)]",
            "px-[var(--pg-office-gutter)] py-[var(--pg-space-3)]"
          )}
        >
          <PgPeerMark accent={accent} size={30} working={presence?.working} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] leading-tight font-semibold text-[var(--pg-color-text-primary)]">
              {peerName}
            </p>
            <p className="truncate text-[11px] text-[var(--pg-color-text-tertiary)]">
              {peerRole}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNavOpen((open) => !open)}
            aria-expanded={navOpen}
            aria-label={copy.sections}
            className={cn(
              "pg-focus-premium inline-flex h-9 w-9 items-center justify-center",
              "rounded-[var(--pg-radius-sm)] border border-[var(--pg-office-line)]",
              "text-[var(--pg-color-text-secondary)]"
            )}
          >
            {navOpen ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
          </button>
        </header>

        {navOpen ? (
          <div
            className={cn(
              "border-b border-[var(--pg-office-line)] bg-[var(--pg-office-chrome)]",
              "px-[var(--pg-office-gutter)] py-[var(--pg-space-3)] lg:hidden"
            )}
          >
            {nav}
            {onBrief ? (
              <button
                type="button"
                onClick={onBrief}
                className={cn(
                  "pg-focus-premium mt-3 inline-flex min-h-9 w-full items-center",
                  "justify-center rounded-[var(--pg-radius-sm)] text-[13.5px]",
                  "font-medium text-[var(--pg-color-text-inverse)]"
                )}
                style={{
                  background: `linear-gradient(145deg, ${accent}, color-mix(in srgb, ${accent} 76%, #000))`,
                }}
              >
                {copy.brief(peerName.split(" ")[0])}
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Presence on narrow screens, where the rail is hidden. */}
        <div className="lg:hidden">
          <PgPresenceLine
            line={presence}
            accentVar={accent}
            suspended={presenceSuspended}
            locale={locale}
            variant="bar"
          />
        </div>

        <main
          key={active}
          className={cn(
            "pg-voice-enter flex min-w-0 flex-1 flex-col",
            "px-[var(--pg-office-gutter)] py-[var(--pg-space-6)]",
            "lg:px-[var(--pg-space-10)] lg:py-[var(--pg-space-8)]"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
