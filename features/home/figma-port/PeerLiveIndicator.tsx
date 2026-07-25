"use client";

import type { HomeTeamPulseItem } from "@/lib/home";

type PeerLiveIndicatorProps = {
  statusKind: HomeTeamPulseItem["statusKind"];
  color: string;
  delay?: number;
  className?: string;
};

export default function PeerLiveIndicator({
  statusKind,
  color,
  delay = 0,
  className,
}: PeerLiveIndicatorProps) {
  switch (statusKind) {
    case "working":
      return (
        <div
          className={`peer-live-bars peer-live-bars--active${className ? ` ${className}` : ""}`}
          aria-hidden
        >
          {[0, 0.18, 0.36, 0.54].map((d, i) => (
            <div
              key={i}
              className="peer-live-bar"
              style={{ background: color, animationDelay: `${delay + d}s` }}
            />
          ))}
        </div>
      );

    case "waiting":
      return (
        <div
          className={`peer-live-dots peer-live-dots--waiting${className ? ` ${className}` : ""}`}
          aria-hidden
        >
          {[0, 0.35, 0.7].map((d, i) => (
            <div
              key={i}
              className="peer-live-dot"
              style={{ background: color, animationDelay: `${delay + d}s` }}
            />
          ))}
        </div>
      );

    case "blocked":
      return (
        <div
          className={`peer-live-warning${className ? ` ${className}` : ""}`}
          aria-hidden
        >
          <div
            className="peer-live-warning-ring"
            style={{ borderColor: "var(--pg-warning)" }}
          />
          <div
            className="peer-live-warning-core"
            style={{ background: "var(--pg-warning)" }}
          />
        </div>
      );

    case "paused":
      return (
        <div
          className={`peer-live-bars peer-live-bars--paused${className ? ` ${className}` : ""}`}
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="peer-live-bar peer-live-bar--static"
              style={{ background: color, opacity: 0.35, height: 4 + i * 1.5 }}
            />
          ))}
        </div>
      );

    case "idle":
    default:
      return (
        <div
          className={`peer-live-idle${className ? ` ${className}` : ""}`}
          aria-hidden
        >
          <div className="peer-live-idle-dot" style={{ background: color, opacity: 0.4 }} />
        </div>
      );
  }
}
