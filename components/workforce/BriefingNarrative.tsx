"use client";

import { PgBriefingKicker } from "@/components/design-system";
import type { HomeMorningNarrative, HomeMovementItem } from "@/lib/home";
import { cn } from "@/lib/ui/cn";
import type { BriefingNarrativeProps } from "./types";

function formatBriefingKicker(morningBriefingLabel: string): string {
  try {
    const date = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
    return `${date} · ${morningBriefingLabel}`;
  } catch {
    return morningBriefingLabel;
  }
}

function buildStoryParagraphs(
  narrative: HomeMorningNarrative,
  awayMovement: HomeMovementItem[]
): string[] {
  const paragraphs: string[] = [];
  const headline = narrative.headline.trim();
  const isInventoryHeadline = /\d+\s+items need/i.test(headline);

  if (awayMovement.length > 0 && isInventoryHeadline) {
    const highlights = awayMovement.slice(0, 3).map((item) => {
      const action = (item.description || item.title).trim();
      const normalized = action.charAt(0).toLowerCase() + action.slice(1);
      return `${item.peerName} ${normalized}`;
    });
    paragraphs.push(`While you were away, ${highlights.join(". ")}.`);
    paragraphs.push(headline);
  } else if (headline) {
    paragraphs.push(headline);
  }

  if (narrative.detail?.trim()) {
    const detail = narrative.detail.trim();
    if (!paragraphs.includes(detail)) {
      paragraphs.push(detail);
    }
  }

  return paragraphs;
}

function supplementalMovement(
  narrative: HomeMorningNarrative,
  awayMovement: HomeMovementItem[]
): HomeMovementItem[] {
  const haystack = `${narrative.headline} ${narrative.detail ?? ""}`.toLowerCase();
  return awayMovement.filter(
    (item) =>
      !haystack.includes(item.title.toLowerCase()) &&
      !haystack.includes(item.peerName.toLowerCase())
  );
}

/**
 * Executive morning brief narrative — kicker, greeting, headline, away movement.
 */
export default function BriefingNarrative({
  narrative,
  awayMovement = [],
  kickerLabel,
  morningBriefingLabel = "Morning briefing",
  className,
}: BriefingNarrativeProps) {
  const storyParagraphs = buildStoryParagraphs(narrative, awayMovement);
  const movementLines = supplementalMovement(narrative, awayMovement);

  return (
    <section aria-label="Morning brief" className={cn("briefing-narrative", className)}>
      <PgBriefingKicker className="briefing-kicker">
        {kickerLabel ?? formatBriefingKicker(morningBriefingLabel)}
      </PgBriefingKicker>

      <header className="briefing-narrative-header" aria-live="polite" aria-atomic="true">
        <h1 className="briefing-greeting">{narrative.greeting}</h1>

        <div className="briefing-story">
          {storyParagraphs.map((paragraph) => (
            <p key={paragraph} className="briefing-prose">
              {paragraph}
            </p>
          ))}
        </div>
      </header>

      {movementLines.length > 0 && (
        <ul className="briefing-away-list">
          {movementLines.slice(0, 3).map((item) => (
            <li key={item.id} className="briefing-away-item">
              <span className="briefing-away-peer">{item.peerName}</span>
              {" — "}
              {item.description || item.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
