"use client";

import Link from "next/link";
import type { HqSpecialistPreview } from "./hq-preview-data";
import {
  HQ_BRIEFING_ITEMS,
  HQ_CONCEPTS,
  HQ_GREETING,
  HQ_MANAGER,
} from "./hq-preview-data";

export function HqPreviewBanner({ concept }: { concept: string }) {
  return (
    <div className="hq-preview-banner">
      <div className="hq-preview-banner__inner">
        <span className="hq-preview-banner__badge">Design preview · mock data only</span>
        <span className="hq-preview-banner__concept">{concept}</span>
        <div className="hq-preview-banner__links">
          <Link href="/design-preview/hq">All concepts</Link>
          <Link href="/home">Current landing (/home)</Link>
        </div>
      </div>
    </div>
  );
}

export function HqConceptNav({ active }: { active: string }) {
  return (
    <nav className="hq-concept-nav" aria-label="HQ concept previews">
      {HQ_CONCEPTS.map((c) => (
        <Link
          key={c.id}
          href={`/design-preview/${c.slug}`}
          className={active === c.id ? "hq-concept-nav__link hq-concept-nav__link--active" : "hq-concept-nav__link"}
        >
          {c.title}
        </Link>
      ))}
    </nav>
  );
}

export function HqGreeting() {
  return (
    <header className="hq-greeting">
      <p className="hq-greeting__eyebrow">Peergent HQ · Preview</p>
      <h1 className="hq-greeting__title">{HQ_GREETING.headline}</h1>
      <p className="hq-greeting__support">{HQ_GREETING.supporting}</p>
    </header>
  );
}

export function HqBriefingReadyPopover() {
  return (
    <div className="hq-briefing-popover" role="status">
      <span className="hq-briefing-popover__pulse" aria-hidden />
      <p className="hq-briefing-popover__label">Briefing ready</p>
      <p className="hq-briefing-popover__text">{HQ_MANAGER.state}</p>
    </div>
  );
}

type HqManagerCardProps = {
  variant?: "default" | "compact" | "hero";
  showPopover?: boolean;
  showBriefingList?: boolean;
};

export function HqManagerCard({
  variant = "default",
  showPopover = true,
  showBriefingList = false,
}: HqManagerCardProps) {
  return (
    <article
      className={`hq-manager hq-manager--${variant}`}
      title={`Preview: ${HQ_MANAGER.destinationLabel}`}
    >
      {showPopover && <HqBriefingReadyPopover />}
      <div className="hq-manager__avatar" aria-hidden>
        {HQ_MANAGER.name.charAt(0)}
      </div>
      <div className="hq-manager__body">
        <p className="hq-manager__role">{HQ_MANAGER.role}</p>
        <h2 className="hq-manager__name">{HQ_MANAGER.name}</h2>
        <p className="hq-manager__state">{HQ_MANAGER.state}</p>
        {showBriefingList && (
          <ul className="hq-manager__brief-list">
            {HQ_BRIEFING_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        <button type="button" className="hq-cta pg-focus-premium">
          {HQ_MANAGER.cta}
          <span className="hq-cta__hint">→ {HQ_MANAGER.destinationLabel}</span>
        </button>
      </div>
    </article>
  );
}

const STATE_CLASS: Record<HqSpecialistPreview["state"], string> = {
  Working: "hq-peer__state--working",
  Monitoring: "hq-peer__state--monitoring",
  "Waiting for review": "hq-peer__state--review",
  Healthy: "hq-peer__state--healthy",
  "Needs attention": "hq-peer__state--attention",
  Paused: "hq-peer__state--paused",
  "Not configured": "hq-peer__state--idle",
};

export function HqSpecialistCard({
  peer,
  layout = "card",
}: {
  peer: HqSpecialistPreview;
  layout?: "card" | "row" | "orbit";
}) {
  return (
    <button
      type="button"
      className={`hq-peer hq-peer--${layout}${peer.attention ? " hq-peer--attention" : ""}`}
      title={`Preview: opens ${peer.destinationLabel}`}
    >
      {peer.attention && <span className="hq-peer__attention-dot" aria-label="Needs attention" />}
      <div className="hq-peer__avatar" aria-hidden>
        {peer.name.charAt(0)}
      </div>
      <div className="hq-peer__meta">
        <p className="hq-peer__name">{peer.name}</p>
        <p className="hq-peer__role">{peer.role}</p>
        <p className="hq-peer__activity">{peer.activity}</p>
        <p className={`hq-peer__state ${STATE_CLASS[peer.state]}`}>{peer.state}</p>
      </div>
      <span className="hq-peer__open-hint">Open workspace →</span>
    </button>
  );
}

export function HqConnectionSvg({ variant }: { variant: "radial" | "vertical" | "mesh" }) {
  return (
    <svg className={`hq-connections hq-connections--${variant}`} viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="hq-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--pg-color-accent)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--pg-color-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--pg-color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {variant === "vertical" && (
        <>
          <path className="hq-connections__path" d="M720 80 L720 180" />
          <path className="hq-connections__path" d="M420 180 L420 280" />
          <path className="hq-connections__path" d="M620 180 L620 280" />
          <path className="hq-connections__path" d="M820 180 L820 280" />
          <path className="hq-connections__path" d="M1020 180 L1020 280" />
        </>
      )}
      {variant === "radial" && (
        <>
          <path className="hq-connections__path" d="M720 200 L320 340" />
          <path className="hq-connections__path" d="M720 200 L520 360" />
          <path className="hq-connections__path" d="M720 200 L920 360" />
          <path className="hq-connections__path" d="M720 200 L1120 340" />
          <path className="hq-connections__path" d="M720 200 L720 380" />
        </>
      )}
      {variant === "mesh" && (
        <>
          <path className="hq-connections__path hq-connections__path--faint" d="M200 120 L1240 120" />
          <path className="hq-connections__path" d="M360 120 L720 200" />
          <path className="hq-connections__path" d="M720 200 L1080 120" />
        </>
      )}
      <circle className="hq-connections__pulse" cx="720" cy="200" r="4" />
    </svg>
  );
}
