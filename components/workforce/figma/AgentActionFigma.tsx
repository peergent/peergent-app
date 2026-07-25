"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { iconForWorkKind, type FigmaAgentSlide } from "./map-home-to-figma";

const BORDER = "1px solid var(--hf-border)";

export type AgentActionFigmaProps = {
  slides: FigmaAgentSlide[];
  sectionLabel?: string;
  onPrimaryActivate?: () => void;
  className?: string;
};

export default function AgentActionFigma({
  slides,
  sectionLabel = "Agent Action",
  onPrimaryActivate,
  className,
}: AgentActionFigmaProps) {
  const router = useRouter();
  const [slideIdx, setSlideIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  if (slides.length === 0) return null;

  const slide = slides[Math.min(slideIdx, slides.length - 1)]!;
  const { palette } = slide;
  const Icon = iconForWorkKind(slide.kind);
  const showPager = slides.length > 1;

  const activate = useCallback(() => {
    if (exiting) return;
    onPrimaryActivate?.();
    setExiting(true);
    window.setTimeout(() => router.push(slide.destination), 380);
  }, [exiting, onPrimaryActivate, router, slide.destination]);

  return (
    <section className={className} aria-label={sectionLabel}>
      <div
        style={{
          padding: "4px 0",
          position: "relative",
          overflow: "hidden",
          opacity: exiting ? 0 : 1,
          transform: exiting ? "translateY(-6px)" : "none",
          transition: "opacity 280ms ease, transform 380ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: palette.statusColor,
              boxShadow: `0 0 4px ${palette.statusColor}`,
            }}
            aria-hidden
          />
          <p
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: palette.statusColor,
            }}
          >
            {sectionLabel}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 9 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: palette.bg,
              border: `1px solid ${palette.color}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: palette.color,
            }}
            aria-hidden
          >
            <Icon size={16} strokeWidth={1.75} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: palette.statusColor,
                  background: palette.statusBg,
                  padding: "1px 7px",
                  borderRadius: 999,
                  border: `1px solid ${palette.statusBorder}`,
                }}
              >
                {slide.status}
              </span>
              <span style={{ fontSize: 10.5, color: "var(--hf-muted-foreground)", fontWeight: 400 }}>
                {slide.peerName}
                {slide.peerRole ? ` · ${slide.peerRole}` : ""}
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--hf-head)",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: "var(--hf-foreground)",
              }}
            >
              {slide.title}
            </h2>
          </div>
        </div>

        <p
          style={{
            fontSize: 11.5,
            color: "var(--hf-muted-foreground)",
            lineHeight: 1.6,
            marginBottom: 10,
            fontWeight: 400,
          }}
        >
          {slide.desc}
        </p>

        {slide.meta.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
            {slide.meta.map((m) => (
              <span
                key={m}
                style={{
                  fontSize: 10,
                  color: "var(--hf-muted-foreground)",
                  background: "rgba(255,255,255,0.05)",
                  border: BORDER,
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {m}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            paddingTop: 11,
            borderTop: BORDER,
          }}
        >
          <button
            type="button"
            className="hf-btn-primary pg-focus-premium"
            onClick={activate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 600,
              color: "white",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--hf-body)",
            }}
          >
            {slide.cta}
            <ArrowRight size={10} aria-hidden />
          </button>
          {slide.secondaryHref && (
            <Link
              href={slide.secondaryHref}
              className="hf-btn-ghost pg-focus-premium"
              style={{
                padding: "6px 11px",
                borderRadius: 8,
                fontSize: 11,
                color: "var(--hf-muted-foreground)",
                background: "rgba(255,255,255,0.04)",
                border: BORDER,
              }}
            >
              {slide.secondary}
            </Link>
          )}
        </div>

        {showPager && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 11,
              paddingTop: 10,
              borderTop: BORDER,
            }}
          >
            <div style={{ display: "flex", gap: 4 }}>
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlideIdx(i)}
                  style={{ border: "none", padding: 0, cursor: "pointer", background: "transparent" }}
                  aria-label={`Slide ${i + 1}`}
                >
                  <div
                    className="hf-slide-dot"
                    style={{
                      height: 3,
                      borderRadius: 999,
                      background: i === slideIdx ? palette.color : "rgba(255,255,255,0.16)",
                      width: i === slideIdx ? 12 : 3,
                    }}
                  />
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: "var(--hf-muted-foreground)", fontWeight: 400 }}>
                {slideIdx + 1} / {slides.length}
              </span>
              {[
                {
                  Icon: ArrowLeft,
                  fn: () => setSlideIdx((i) => (i - 1 + slides.length) % slides.length),
                },
                { Icon: ArrowRight, fn: () => setSlideIdx((i) => (i + 1) % slides.length) },
              ].map(({ Icon, fn }, k) => (
                <button
                  key={k}
                  type="button"
                  onClick={fn}
                  className="pg-focus-premium"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.06)",
                    border: BORDER,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--hf-muted-foreground)",
                  }}
                >
                  <Icon size={9} aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
