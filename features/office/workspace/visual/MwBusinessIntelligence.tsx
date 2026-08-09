"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import type {
  MarketingWorkspaceBiBullet,
  MarketingWorkspaceBusinessIntelligenceBand,
} from "@/lib/office/workspace/types";

export function MwBusinessIntelligence({
  band,
  bullets,
  metricKey,
  nl,
}: {
  band: MarketingWorkspaceBusinessIntelligenceBand;
  bullets: readonly MarketingWorkspaceBiBullet[];
  metricKey: string;
  nl: boolean;
}) {
  const inner = (
    <>
      <p className="pg-ds-label pg-mw-bi__eyebrow">{band.eyebrow}</p>
      <h2 className="pg-mw-bi__title">{band.title}</h2>
      <ul
        key={metricKey}
        className="pg-mw-bi__bullets pg-mw-fade-swap"
        data-testid="pg-mw-business-intelligence"
      >
        {bullets.map((bullet, index) => (
          <li
            key={bullet.id}
            className={cn(
              "pg-mw-bi__bullet",
              `pg-mw-bi__bullet--${bullet.tone}`,
              "pg-mw-stagger-in"
            )}
            style={{ ["--pg-mw-stagger-i" as string]: index }}
          >
            <span className="pg-mw-bi__bullet-dot" aria-hidden />
            <span>{bullet.text}</span>
          </li>
        ))}
      </ul>
    </>
  );

  if (band.href) {
    return (
      <Link
        href={band.href}
        className={cn(
          "pg-cc6-card pg-mw-bi pg-focus-premium",
          "pg-ds-card--interactive"
        )}
        aria-label={
          nl ? "Business intelligence — bekijk performance" : "Business intelligence — view performance"
        }
      >
        {inner}
      </Link>
    );
  }

  return <article className="pg-cc6-card pg-mw-bi">{inner}</article>;
}
