"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Bot, Users } from "lucide-react";
import { AudioBars, PulseDot, TypingDots } from "./atoms";
import type { FigmaDeptPalette } from "./map-home-to-figma";

export type PeerFigmaCard = {
  peerId: string;
  name: string;
  role: string;
  detail: string;
  href: string;
  palette: FigmaDeptPalette & { delay: number };
  isWorking: boolean;
};

export type CurrentlyWorkingFigmaProps = {
  title?: string;
  items: PeerFigmaCard[];
  activeCount?: number;
  activeBadgeLabel?: string;
  footerHref?: string;
  footerLabel?: string;
  openWorkspaceLabel?: string;
  className?: string;
};

export default function CurrentlyWorkingFigma({
  title = "Currently working",
  items,
  activeCount = 0,
  activeBadgeLabel,
  footerHref = "/team",
  footerLabel = "See all your peers",
  openWorkspaceLabel = "Open workspace",
  className,
}: CurrentlyWorkingFigmaProps) {
  if (items.length === 0) return null;

  const badge =
    activeBadgeLabel ?? (activeCount === 1 ? "1 active" : activeCount > 0 ? `${activeCount} active` : "");

  return (
    <section className={className} aria-label={title}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Bot size={13} strokeWidth={1.8} style={{ color: "var(--hf-muted-foreground)", opacity: 0.55 }} />
            <p
              style={{
                fontFamily: "var(--hf-head)",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: "-0.02em",
                color: "var(--hf-foreground)",
              }}
            >
              {title}
            </p>
          </div>
          {activeCount > 0 && badge && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                fontWeight: 500,
                padding: "2px 9px",
                borderRadius: 999,
                background: "rgba(52,211,153,0.1)",
                color: "#34D399",
                border: "1px solid rgba(52,211,153,0.2)",
              }}
            >
              <PulseDot color="#34D399" />
              {badge}
            </div>
          )}
        </div>
        {footerHref && (
          <Link
            href={footerHref}
            className="hf-btn-outline pg-focus-premium"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--hf-muted-foreground)",
              background: "transparent",
              border: "1px solid var(--hf-border)",
            }}
          >
            <Users size={13} aria-hidden />
            {footerLabel}
            <ArrowRight size={12} aria-hidden />
          </Link>
        )}
      </div>

      <div className="home-figma-peers-grid">
        {items.map((p) => (
          <div key={p.peerId} className="hf-premium-card">
            <Link
              href={p.href}
              className="pg-focus-premium"
              style={{
                display: "block",
                padding: "16px 16px 14px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    className={p.isWorking ? "hf-breathing" : undefined}
                    style={
                      {
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: p.palette.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: p.palette.color,
                        "--hf-glow": `${p.palette.color}38`,
                        animationDelay: `${p.palette.delay}s`,
                      } as CSSProperties
                    }
                  >
                    <Bot size={14} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--hf-foreground)",
                        lineHeight: 1.2,
                      }}
                    >
                      {p.name}
                    </p>
                    <p style={{ fontSize: 10.5, color: p.palette.color, lineHeight: 1, fontWeight: 500 }}>
                      {p.role}
                    </p>
                  </div>
                </div>
                {p.isWorking && <AudioBars color={p.palette.color} delay={p.palette.delay} />}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                {p.isWorking && <TypingDots color={p.palette.color} />}
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--hf-muted-foreground)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 400,
                  }}
                >
                  {p.detail}
                </p>
              </div>

              <div
                className="hf-btn-outline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "5px 0",
                  borderRadius: 7,
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: "var(--hf-muted-foreground)",
                  background: "transparent",
                  border: "1px solid var(--hf-border)",
                }}
              >
                {openWorkspaceLabel}
                <ArrowRight size={9} aria-hidden />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
