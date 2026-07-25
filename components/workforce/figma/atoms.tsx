"use client";

import { useEffect, useRef } from "react";

export function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[0, 0.22, 0.44].map((d, i) => (
        <div
          key={i}
          className="hf-type-dot"
          style={{ background: color, animationDelay: `${d}s` }}
        />
      ))}
    </div>
  );
}

export function AudioBars({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 1.5,
        height: 12,
        flexShrink: 0,
      }}
    >
      {[0, 0.18, 0.36, 0.54].map((d, i) => (
        <div
          key={i}
          className="hf-bar"
          style={{ background: color, animationDelay: `${delay + d}s` }}
        />
      ))}
    </div>
  );
}

export function PulseDot({ color }: { color: string }) {
  return (
    <div style={{ position: "relative", width: 7, height: 7, flexShrink: 0 }}>
      <div
        className="hf-pulse-ring"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `1.5px solid ${color}`,
          transformOrigin: "center",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 1,
          borderRadius: "50%",
          background: color,
        }}
      />
    </div>
  );
}

export function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio, 2);
    const N = 34;
    const MAX = 105;
    type Pt = { x: number; y: number; vx: number; vy: number };
    let pts: Pt[] = [];
    let raf: number;

    const setup = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      pts = Array.from({ length: N }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.11,
        vy: (Math.random() - 0.5) * 0.11,
      }));
    };

    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(canvas);
    const op = 0.022;

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < MAX) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(68,114,255,${(1 - d / MAX) * op})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(100,140,255,0.06)";
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

export function HomeFigmaAmbient() {
  return (
    <div className="home-figma-ambient" aria-hidden>
      <NeuralCanvas />
      <div
        className="hf-orb"
        style={{
          position: "absolute",
          top: "14%",
          left: "32%",
          width: 580,
          height: 580,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(123,111,255,0.065) 0%, transparent 70%)",
          filter: "blur(64px)",
        }}
      />
      <div
        className="hf-orb2"
        style={{
          position: "absolute",
          bottom: "12%",
          right: "14%",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,205,176,0.045) 0%, transparent 70%)",
          filter: "blur(52px)",
        }}
      />
    </div>
  );
}
