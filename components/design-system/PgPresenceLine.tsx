"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import { MOTION, type PresenceLine } from "@/lib/design-system/foundation";

/**
 * §3 The presence line. Present on every destination, above the tab bar so it
 * reads as the Peer speaking about her office rather than as a page subtitle.
 *
 * §8.1 Behaviour, in full:
 *  - Updates on arrival, on a change of what the customer is looking at, and
 *    when something genuinely changes while they read.
 *  - Holds on sorting, scrolling, hovering and routine progress.
 *  - When the conclusion has not changed the sentence stays byte-identical.
 *    She does not rephrase; rewording without new meaning is what would make
 *    her feel unstable.
 *  - Frozen entirely while the customer is typing.
 *  - Fixed height reserved from first paint, so the line can never cause
 *    reflow and nothing below it ever moves.
 *
 * Announcement: the visible sentence sits in normal reading order, so on
 * arrival it is simply the first thing on the page — no separate
 * interruption. Changes after mount are announced through a separate live
 * region: politely as a rule, promptly for a fault, because withholding a
 * failure is the dishonesty the product refuses everywhere else.
 */

/** §8.1 If two things happen in quick succession she says one thing, not two. */
const COALESCE_MS = 900;

export type PgPresenceLineProps = {
  line: PresenceLine | null;
  /** Identity accent — the marker only. Never a control colour. */
  accentVar?: string;
  /** True while the customer is typing. Freezes the line entirely. */
  suspended?: boolean;
  /**
   * `rail` sits inside the workspace column as part of her identity.
   * `bar` is the narrow-screen fallback where no rail exists.
   */
  variant?: "rail" | "bar";
  /** Locale for the state word. Domain copy already resolves its own. */
  locale?: string | null;
  className?: string;
  testId?: string;
};

/** Short state word shown above her sentence, so presence reads at a glance. */
const RUNG_LABEL: Record<string, Record<string, string>> = {
  en: {
    interpretation: "Needs you",
    qualified: "Early read",
    observation: "Working",
    orientation: "Ready",
    gap: "Waiting on a connection",
    fault: "Needs help",
    dormant: "Working",
  },
  nl: {
    interpretation: "Vraagt je aandacht",
    qualified: "Eerste beeld",
    observation: "Aan het werk",
    orientation: "Klaar",
    gap: "Wacht op een koppeling",
    fault: "Heeft hulp nodig",
    dormant: "Aan het werk",
  },
};

export default function PgPresenceLine({
  line,
  accentVar = "var(--pg-color-accent)",
  suspended = false,
  variant = "bar",
  locale,
  className,
  testId,
}: PgPresenceLineProps) {
  const [shown, setShown] = useState<PresenceLine | null>(line);
  const [announcement, setAnnouncement] = useState<string>("");

  const mountedRef = useRef(false);
  const lastChangeAtRef = useRef(0);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // §8.1 Frozen while the customer is typing — she does not talk over them.
    if (suspended) return;

    const nextText = line?.text ?? "";
    const currentText = shown?.text ?? "";

    // §8.1 Same conclusion, same sentence. No crossfade, no announcement,
    // nothing at all. This is the anti-jitter rule.
    if (nextText === currentText) return;

    const apply = () => {
      lastChangeAtRef.current = Date.now();
      setShown(line);

      // On arrival the sentence is read in normal document order, so the live
      // region stays silent for the first paint.
      if (mountedRef.current && line) {
        setAnnouncement(line.text);
      }
    };

    const sinceLast = Date.now() - lastChangeAtRef.current;
    const wait = sinceLast < COALESCE_MS ? COALESCE_MS - sinceLast : 0;

    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(apply, wait);

    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
    };
  }, [line, shown, suspended]);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  const isFault = shown?.rung === "fault";

  const rungLabel = shown
    ? (locale === "nl" ? RUNG_LABEL.nl : RUNG_LABEL.en)[shown.rung]
    : null;

  const liveRegion = (
    <span
      // Silent on arrival; speaks only when something changed that the
      // customer did not already read in document order.
      aria-live={isFault ? "assertive" : "polite"}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </span>
  );

  /* ---- Rail: presence as part of her identity ---------------------------- */
  if (variant === "rail") {
    // An empty bordered box is worse than no box: it reads as a component that
    // failed rather than as a Peer with nothing to say. §11.3 — silence is
    // earned and explained, never rendered as a blank container.
    if (!shown?.text) return liveRegion;

    const railBody = (
      <>
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "pg-presence-dot",
              shown?.working && "pg-presence-dot--working"
            )}
            style={{ color: accentVar, background: accentVar }}
            aria-hidden
          />
          <span
            className="text-[10.5px] font-medium tracking-[0.06em] uppercase"
            style={{ color: accentVar }}
          >
            {rungLabel ?? ""}
          </span>
          {shown?.timeLabel ? (
            <span className="ml-auto text-[10.5px] text-[var(--pg-color-text-tertiary)]">
              {shown.timeLabel}
            </span>
          ) : null}
        </span>

        <p className="mt-2 text-[13px] leading-[1.55] text-[var(--pg-color-text-secondary)]">
          {shown?.text ?? ""}
        </p>
      </>
    );

    return (
      <div
        className={cn(
          "min-h-[92px] rounded-[var(--pg-radius-md)] border p-3",
          "border-[var(--pg-office-line)]",
          className
        )}
        style={{
          // Her accent bleeds up from the base of the block, so presence feels
          // lit from within rather than boxed.
          backgroundImage: `linear-gradient(180deg, transparent, ${accentVar}12)`,
        }}
        data-rung={shown?.rung}
        data-testid={testId}
      >
        {shown?.href ? (
          <Link
            href={shown.href}
            className="pg-focus-premium block rounded-[var(--pg-radius-sm)] transition-opacity duration-[var(--pg-duration-state)] hover:opacity-90"
          >
            {railBody}
          </Link>
        ) : (
          railBody
        )}
        {liveRegion}
      </div>
    );
  }

  /* ---- Bar: narrow screens, where no rail exists ------------------------- */
  const barBody = (
    <>
      <span
        className={cn(
          "pg-presence-dot mt-[7px]",
          shown?.working && "pg-presence-dot--working"
        )}
        style={{ color: accentVar, background: accentVar }}
        aria-hidden
      />
      <p className="flex-1 text-[14px] leading-[1.5] text-[var(--pg-color-text-secondary)]">
        {shown?.text ?? ""}
      </p>
    </>
  );

  return (
    <div
      className={cn(
        // Fixed minimum height reserved from first paint (§8.1).
        "flex min-h-[52px] shrink-0 items-start",
        "gap-[var(--pg-space-3)] border-b border-[var(--pg-office-line)]",
        "bg-[var(--pg-office-chrome)]",
        "px-[var(--pg-office-gutter)] py-[var(--pg-space-3)]",
        className
      )}
      style={{
        // A faint wash of her accent from the leading edge, so the band is
        // hers rather than the page's chrome.
        backgroundImage: `linear-gradient(90deg, ${accentVar}0F, transparent 42%)`,
      }}
      data-rung={shown?.rung}
      data-testid={testId}
    >
      {shown?.href ? (
        <Link
          href={shown.href}
          className="pg-focus-premium flex flex-1 items-start gap-[var(--pg-space-3)]"
        >
          {barBody}
        </Link>
      ) : (
        <div className="flex flex-1 items-start gap-[var(--pg-space-3)]">{barBody}</div>
      )}
      {liveRegion}
    </div>
  );
}

/** Crossfade wrapper for callers that swap the whole line on a view change. */
export function PgPresenceTransitionKey({ value }: { value: string }) {
  return <span key={value} className="pg-voice-enter" />;
}

export { MOTION as PG_MOTION };
