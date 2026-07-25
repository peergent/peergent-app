"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BriefingDecisionProps } from "@/components/workforce/types";
import type { HomeMorningNarrative } from "@/lib/home";

export type MorningBriefFigmaProps = {
  kicker: string;
  narrative: HomeMorningNarrative;
  decision: BriefingDecisionProps | null;
  workforceLine: string | null;
  className?: string;
};

export default function MorningBriefFigma({
  kicker,
  narrative,
  decision,
  workforceLine,
  className,
}: MorningBriefFigmaProps) {
  const paragraphs = [narrative.headline, narrative.detail].filter(Boolean) as string[];

  return (
    <section className={className} style={{ position: "relative", zIndex: 1 }} aria-label="Morning brief">
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "var(--hf-muted-foreground)",
          marginBottom: 10,
          opacity: 0.7,
        }}
      >
        {kicker}
      </p>

      <h1
        style={{
          fontFamily: "var(--hf-head)",
          fontWeight: 800,
          fontSize: 40,
          letterSpacing: "-0.042em",
          lineHeight: 1.08,
          color: "var(--hf-foreground)",
          marginBottom: 20,
        }}
      >
        {narrative.greeting}
      </h1>

      {paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          style={{
            fontSize: 15,
            color: "var(--hf-muted-foreground)",
            fontWeight: 400,
            lineHeight: 1.75,
            marginBottom: 12,
            maxWidth: 680,
          }}
        >
          {paragraph}
        </p>
      ))}

      {decision && (
        <div
          className="hf-decision-border"
          style={{
            maxWidth: 480,
            marginBottom: 6,
            marginTop: 8,
            borderRadius: 12,
            padding: 1.5,
            background:
              "linear-gradient(135deg, rgba(91,110,255,0.7) 0%, rgba(155,109,255,0.55) 35%, rgba(91,110,255,0.2) 65%, rgba(155,109,255,0.65) 100%)",
          }}
        >
          <div
            style={{
              borderRadius: 11,
              padding: "14px 18px 12px",
              background:
                "linear-gradient(135deg, rgba(68,114,255,0.1) 0%, rgba(139,92,246,0.08) 55%, rgba(168,85,247,0.05) 100%), var(--hf-card)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--hf-head)",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "-0.022em",
                lineHeight: 1.35,
                color: "var(--hf-foreground)",
                marginBottom: 10,
              }}
            >
              {decision.title}
            </p>
            <Link
              href={decision.href}
              className="pg-focus-premium"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                fontWeight: 500,
                color: "var(--hf-primary)",
                opacity: 0.85,
                letterSpacing: "0.01em",
              }}
            >
              {decision.ctaLabel}
              <ArrowRight size={11} aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {workforceLine && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 20, marginBottom: 0 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#34D399",
              display: "inline-block",
              boxShadow: "0 0 6px rgba(52,211,153,0.5)",
            }}
            aria-hidden
          />
          <p style={{ fontSize: 12, color: "var(--hf-muted-foreground)", fontWeight: 400 }}>{workforceLine}</p>
        </div>
      )}

      <div style={{ height: 1, background: "var(--hf-border)", marginTop: 18 }} aria-hidden />
    </section>
  );
}
