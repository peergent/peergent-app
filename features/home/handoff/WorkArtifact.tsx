"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { HandoffPrimaryWork, HandoffUrgency } from "@/lib/home/handoff-types";
import { cn } from "@/lib/ui/cn";

type WorkArtifactProps = {
  work: HandoffPrimaryWork;
  urgency: HandoffUrgency;
  landed: boolean;
  onTransitionStart?: () => void;
};

export default function WorkArtifact({ work, urgency, landed, onTransitionStart }: WorkArtifactProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowOpen(true), 2400);
    return () => window.clearTimeout(timer);
  }, []);

  const activate = useCallback(() => {
    if (exiting) return;
    onTransitionStart?.();
    setExiting(true);
    window.setTimeout(() => {
      router.push(work.destination);
    }, 420);
  }, [exiting, onTransitionStart, router, work.destination]);

  const openVisible = hovered || focused || showOpen;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Open ${work.title} from ${work.peerName}`}
      className={cn(
        "handoff-artifact pg-focus-premium group relative w-full max-w-[340px] text-left",
        "transition-transform duration-[280ms] ease-out",
        landed && "handoff-artifact-landed",
        exiting && "handoff-artifact-exit",
        urgency === "urgent" && "handoff-artifact-urgent",
        urgency === "blocked" && "handoff-artifact-blocked",
        (hovered || focused) && !exiting && "handoff-artifact-hover"
      )}
    >
      <div className="handoff-artifact-body">
        <div className="handoff-artifact-edge" aria-hidden />
        <div className="handoff-artifact-face">
          <p className="handoff-artifact-kind">{kindLabel(work.kind)}</p>
          <h2 className="handoff-artifact-title">{work.title}</h2>
          {work.contextLine && (
            <p className="handoff-artifact-context">{work.contextLine}</p>
          )}
          <div className="handoff-artifact-meta">
            <span>{work.peerName}</span>
            {work.completedAtLabel && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={work.completedAt ?? undefined}>{work.completedAtLabel}</time>
              </>
            )}
          </div>
        </div>
      </div>
      <span
        className={cn(
          "handoff-artifact-open mt-4 block text-sm font-medium text-[var(--pg-color-accent)]",
          "transition-opacity duration-200",
          openVisible ? "opacity-100" : "opacity-0 md:opacity-0",
          "max-md:opacity-100 max-md:delay-500"
        )}
      >
        Open →
      </span>
    </button>
  );
}

function kindLabel(kind: HandoffPrimaryWork["kind"]): string {
  switch (kind) {
    case "strategy":
      return "Strategy";
    case "plan":
      return "Campaign plan";
    case "draft":
      return "Draft";
    case "publication":
      return "Publication";
    case "context":
      return "Context needed";
    case "onboarding":
      return "Get started";
    default:
      return "Work";
  }
}
