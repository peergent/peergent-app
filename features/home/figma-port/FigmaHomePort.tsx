"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import { formatHomeRelativeTime } from "@/lib/i18n";
import CurrentlyWorkingPeers from "./CurrentlyWorkingPeers";
import ExecutiveDecisionCard from "./ExecutiveDecisionCard";
import ExecutiveMorningBrief from "./ExecutiveMorningBrief";
import {
  buildActivityRows,
  buildAgentSlides,
  buildBrief,
  buildPeerCards,
  type FigmaSlide,
} from "./figma-port-data";
import "./figma-home.css";

import FigmaHomeWorkspaceShell from "./FigmaHomeWorkspaceShell";

const BODY = "'Space Grotesk', system-ui, sans-serif";
const HEAD = "'Space Grotesk', system-ui, sans-serif";
const border = "1px solid var(--border)";

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[0, 0.22, 0.44].map((d, i) => (
        <div key={i} className="type-dot" style={{ background: color, animationDelay: `${d}s` }} />
      ))}
    </div>
  );
}

function AudioBars({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 12, flexShrink: 0 }}>
      {[0, 0.18, 0.36, 0.54].map((d, i) => (
        <div key={i} className="bar" style={{ background: color, animationDelay: `${delay + d}s` }} />
      ))}
    </div>
  );
}

function PulseDot({ color }: { color: string }) {
  return (
    <div style={{ position: "relative", width: 7, height: 7, flexShrink: 0 }}>
      <div
        className="pulse-ring"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `1.5px solid ${color}`,
          transformOrigin: "center",
        }}
      />
      <div style={{ position: "absolute", inset: 1, borderRadius: "50%", background: color }} />
    </div>
  );
}


export type FigmaHomePortProps = {
  homeState: HandoffHomeState;
  onPrimaryActivate?: () => void;
};

export default function FigmaHomePort({ homeState, onPrimaryActivate }: FigmaHomePortProps) {
  const { handoff, viewModel, copy, inboxCount } = homeState;
  const { resolved } = useTheme();
  const router = useRouter();
  const [slideIdx, setSlideIdx] = useState(0);

  const slides = handoff ? buildAgentSlides(handoff, viewModel, copy) : [];
  const activity = buildActivityRows(viewModel?.recentMovement ?? [], (iso) =>
    formatHomeRelativeTime(iso, copy)
  );
  const peers = buildPeerCards(viewModel?.teamPulse ?? [], copy);
  const activeCount = handoff?.companyActivity.activeCount ?? 0;
  const activeBadge =
    activeCount === 1 ? copy.ui.activeBadgeSingle : copy.ui.activeBadgeMultiple(activeCount);

  useEffect(() => {
    if (slideIdx >= slides.length) setSlideIdx(0);
  }, [slideIdx, slides.length]);

  if (!handoff) return null;

  const { brief, decision, workforceLine, peerNames } = buildBrief({ viewModel, handoff, copy });
  const slide: FigmaSlide | undefined = slides[Math.min(slideIdx, Math.max(slides.length - 1, 0))];

  return (
    <FigmaHomeWorkspaceShell
      inboxCount={inboxCount}
      mainClassName="scrollbar-hide dot-grid"
      mainStyle={{
        padding: "36px 44px 60px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
        paddingBottom: "max(60px, calc(60px + env(safe-area-inset-bottom)))",
      }}
    >
        {resolved === "dark" && (
          <div
            className="aurora-hero"
            style={{
              position: "absolute",
              top: -40,
              left: -60,
              width: 700,
              height: 480,
              borderRadius: "50%",
              background: "var(--pg-ambient-hero)",
              filter: "blur(52px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        )}

        {/* WELCOME BRIEFING — CEO Morning Brief */}
        <motion.section
          className="executive-brief-section"
          style={{ position: "relative", zIndex: 1 }}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
        >
          <ExecutiveMorningBrief brief={brief} peerNames={peerNames} />

          {decision && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ maxWidth: 520, marginTop: 24, marginBottom: 6 }}
            >
              <ExecutiveDecisionCard card={decision} />
            </motion.div>
          )}

          {workforceLine && (
            <div className="executive-brief-workforce">
              <span className="live-dot status-alive executive-brief-live-dot" aria-hidden />
              <p>{workforceLine}</p>
            </div>
          )}

          <div className="living-divider" />
        </motion.section>

        {/* AGENT ACTION + RECENT ACTIVITY */}
        <motion.section
          className="figma-agent-activity-grid"
          style={{ position: "relative", zIndex: 1 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.08 }}
        >
          {slide ? (
            <div className="agent-action-slot">
              <div className="agent-action-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                <span
                  className="status-alive"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: slide.statusColor,
                    boxShadow: `0 0 4px ${slide.statusColor}`,
                  }}
                />
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: slide.statusColor,
                  }}
                >
                  {copy.ui.agentAction}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 9 }}>
                <div
                  className="agent-icon-tile breathing"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: slide.bg,
                    border: `1px solid ${slide.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: slide.color,
                    "--glow": `${slide.color}40`,
                  } as CSSProperties}
                >
                  <slide.Icon size={16} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: slide.statusColor,
                        background: slide.statusBg,
                        padding: "1px 7px",
                        borderRadius: 999,
                        border: `1px solid ${slide.statusBorder}`,
                      }}
                    >
                      {slide.status}
                    </span>
                    <span style={{ fontSize: 10.5, color: "var(--muted-foreground)", fontWeight: 400 }}>
                      {slide.agent} · {slide.dept}
                    </span>
                  </div>
                  <h2
                    style={{
                      fontFamily: HEAD,
                      fontWeight: 700,
                      fontSize: 14,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      color: "var(--foreground)",
                    }}
                  >
                    {slide.title}
                  </h2>
                </div>
              </div>

              <p style={{ fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.6, marginBottom: 10, fontWeight: 400 }}>
                {slide.desc}
              </p>

              {slide.meta.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                  {slide.meta.map((m) => (
                    <span
                      key={m}
                      style={{
                        fontSize: 10,
                        color: "var(--muted-foreground)",
                        background: "var(--pg-pill-bg)",
                        border,
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 11, borderTop: border }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    onPrimaryActivate?.();
                    router.push(slide.destination);
                  }}
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
                    fontFamily: BODY,
                  }}
                >
                  {slide.cta}
                  <ArrowRight size={10} />
                </button>
                {slide.secondaryHref && (
                  <Link
                    href={slide.secondaryHref}
                    className="btn-ghost"
                    style={{
                      padding: "6px 11px",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "var(--muted-foreground)",
                      background: "var(--pg-btn-ghost-bg)",
                      border,
                    }}
                  >
                    {slide.secondary}
                  </Link>
                )}
              </div>

              {slides.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 11,
                    paddingTop: 10,
                    borderTop: border,
                  }}
                >
                  <div style={{ display: "flex", gap: 4 }}>
                    {slides.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSlideIdx(i)}
                        style={{ border: "none", padding: 0, cursor: "pointer", background: "transparent" }}
                      >
                        <div
                          className="slide-dot"
                          style={{
                            height: 3,
                            borderRadius: 999,
                            background: i === slideIdx ? s.color : "var(--pg-carousel-dot-idle)",
                            width: i === slideIdx ? 12 : 3,
                          }}
                        />
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 400 }}>
                      {slideIdx + 1} / {slides.length}
                    </span>
                    {[
                      { I: ArrowLeft, fn: () => setSlideIdx((i) => (i - 1 + slides.length) % slides.length) },
                      { I: ArrowRight, fn: () => setSlideIdx((i) => (i + 1) % slides.length) },
                    ].map(({ I: Ic, fn }, k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={fn}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "var(--pg-control-bg)",
                          border,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        <Ic size={9} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
                </motion.div>
              </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="agent-action-slot" />
          )}

          <div className="pg-premium-frame activity-panel-card">
            <div className="pg-premium-frame-ambient" aria-hidden />
            <div className="pg-premium-frame-shimmer" aria-hidden />
            <div className="pg-premium-frame-inner activity-panel-inner">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p className="section-label">{copy.recentMovement}</p>
              </div>
              <div className="scrollbar-thin" style={{ maxHeight: 310, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
                {activity.length === 0 ? (
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{copy.recentMovementEmpty}</p>
                ) : (
                  activity.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.32, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    >
                    <Link
                      href={a.href}
                      className="activity-item"
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "7px 4px",
                        borderBottom: i < activity.length - 1 ? border : "none",
                        opacity: i === 0 ? 1 : Math.max(0.38, 1 - i * 0.1),
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 4 }}>
                        <div
                          className={i === 0 ? "activity-live-dot" : undefined}
                          style={{
                            width: i === 0 ? 5 : 4,
                            height: i === 0 ? 5 : 4,
                            borderRadius: "50%",
                            background: a.color,
                            flexShrink: 0,
                            opacity: i === 0 ? 1 : 0.7,
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: i === 0 ? 12 : 11,
                            fontWeight: i === 0 ? 500 : 400,
                            color: i === 0 ? "var(--foreground)" : "var(--muted-foreground)",
                            lineHeight: 1.3,
                            marginBottom: 2,
                          }}
                        >
                          {a.title}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 400, opacity: 0.65 }}>{a.desc}</p>
                          <span style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--muted-foreground)", opacity: 0.3, flexShrink: 0 }} />
                          <p style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 400, opacity: 0.5 }}>{a.time}</p>
                        </div>
                      </div>
                    </Link>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* CURRENTLY WORKING */}
        {peers.length > 0 && viewModel && (
          <CurrentlyWorkingPeers
            peers={peers}
            viewModel={viewModel}
            copy={copy}
            activeCount={activeCount}
            activeBadge={activeBadge}
            formatTime={(iso) => formatHomeRelativeTime(iso, copy)}
          />
        )}
    </FigmaHomeWorkspaceShell>
  );
}
