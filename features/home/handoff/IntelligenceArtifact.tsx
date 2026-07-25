"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import type { HandoffPrimaryWork, HandoffUrgency } from "@/lib/home/handoff-types";
import { cn } from "@/lib/ui/cn";
import BackgroundIntelligence from "./BackgroundIntelligence";
import NeuralCircuitAnimation from "./NeuralCircuitAnimation";

type IntelligenceArtifactProps = {
  work: HandoffPrimaryWork;
  categoryLabel: string;
  urgency: HandoffUrgency;
  onTransitionStart?: () => void;
};

export default function IntelligenceArtifact({
  work,
  categoryLabel,
  urgency,
  onTransitionStart,
}: IntelligenceArtifactProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const activate = useCallback(() => {
    if (exiting) return;
    onTransitionStart?.();
    setExiting(true);
    window.setTimeout(() => router.push(work.destination), 380);
  }, [exiting, onTransitionStart, router, work.destination]);

  const openVisible = hovered || focused || showOpen;

  return (
    <div className="home-artifact-wrap relative mt-8 w-full">
      <BackgroundIntelligence className="-inset-x-8 -inset-y-6" />

      <button
        type="button"
        onClick={activate}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Open ${work.title}`}
        className={cn(
          "home-artifact pg-focus-premium group relative w-full text-left",
          exiting && "home-artifact-exiting",
          urgency === "urgent" && "home-artifact-urgent",
          (hovered || focused) && "home-artifact-active"
        )}
      >
        <div className="home-artifact-stack" aria-hidden>
          <div className="home-artifact-stack-layer" />
          <div className="home-artifact-stack-layer" />
        </div>

        <div className="home-artifact-surface">
          <div className="home-artifact-content">
            <div className="home-artifact-icon" aria-hidden>
              <Rocket size={22} strokeWidth={1.75} />
            </div>
            <p className="home-artifact-category">{categoryLabel}</p>
            <h2 className="home-artifact-title">{work.title}</h2>
            <p className="home-artifact-meta">Completed by {work.peerName}</p>
            {work.completedAtLabel && (
              <p className="home-artifact-time">{work.completedAtLabel}</p>
            )}
            <span
              className={cn(
                "home-artifact-open mt-6 inline-block text-[15px] font-medium text-[var(--pg-color-accent)]",
                "transition-opacity duration-200",
                openVisible ? "opacity-100" : "opacity-70 md:opacity-0"
              )}
            >
              Open →
            </span>
          </div>

          <div className="home-artifact-visual">
            <NeuralCircuitAnimation />
          </div>
        </div>
      </button>
    </div>
  );
}
