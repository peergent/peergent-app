"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Home,
  Inbox,
  Users,
} from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import PgThemeToggle from "@/components/theme/PgThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import "./figma-home.css";

const BODY = "'Space Grotesk', system-ui, sans-serif";
const HEAD = "'Space Grotesk', system-ui, sans-serif";
const border = "1px solid var(--border)";

const NAV = [
  { id: "home", label: "Command Center", Icon: Home, href: "/home" },
  { id: "inbox", label: "Inbox", Icon: Inbox, href: "/inbox" },
  { id: "team", label: "Team", Icon: Users, href: "/team" },
  { id: "company", label: "Company", Icon: Building2, href: "/company" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home" || pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NeuralCanvas({ light }: { light: boolean }) {
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
    const op = light ? 0.04 : 0.022;
    const nodeFill = light ? "rgba(68,114,255,0.07)" : "rgba(100,140,255,0.06)";
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
        ctx.fillStyle = nodeFill;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [light]);
  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

function PeergentMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="figma-pm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="7" fill="url(#figma-pm-g)" />
      <rect width="28" height="14" rx="7" fill="rgba(255,255,255,0.09)" />
      <path
        d="M8.5 21V8h7a4.5 4.5 0 0 1 0 9H8.5"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export type FigmaHomeWorkspaceShellProps = {
  children: ReactNode;
  inboxCount?: number;
  mainClassName?: string;
  mainStyle?: CSSProperties;
};

export default function FigmaHomeWorkspaceShell({
  children,
  inboxCount = 0,
  mainClassName,
  mainStyle,
}: FigmaHomeWorkspaceShellProps) {
  const { account } = useAccount();
  const { resolved } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  const userInitial =
    account?.fullName?.trim()?.charAt(0)?.toUpperCase() ??
    account?.email?.charAt(0)?.toUpperCase() ??
    "?";
  const SW = open ? 164 : 40;

  return (
    <div
      className="figma-home-port figma-home-workspace-shell"
      style={{
        display: "flex",
        height: "100vh",
        minHeight: "100vh",
        width: "100%",
        background: "var(--background)",
        color: "var(--foreground)",
        fontFamily: BODY,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <NeuralCanvas light={resolved === "light"} />
        {resolved === "dark" && (
          <>
            <div
              className="orb"
              style={{
                position: "absolute",
                top: "14%",
                left: "32%",
                width: 580,
                height: 580,
                borderRadius: "50%",
                background: "var(--pg-ambient-orb-1)",
                filter: "blur(64px)",
              }}
            />
            <div
              className="orb2"
              style={{
                position: "absolute",
                bottom: "12%",
                right: "14%",
                width: 420,
                height: 420,
                borderRadius: "50%",
                background: "var(--pg-ambient-orb-2)",
                filter: "blur(52px)",
              }}
            />
            <div className="sparkle" style={{ position: "absolute", top: "22%", left: "18%", width: 3, height: 3, borderRadius: "50%" }} />
            <div className="sparkle sparkle-delay-1" style={{ position: "absolute", top: "38%", right: "22%", width: 2, height: 2, borderRadius: "50%" }} />
            <div className="sparkle sparkle-delay-2" style={{ position: "absolute", bottom: "28%", left: "42%", width: 2.5, height: 2.5, borderRadius: "50%" }} />
          </>
        )}
      </div>

      <nav
        className="sidebar-mission hidden lg:flex"
        style={{
          width: SW,
          flexShrink: 0,
          borderRight: "1px solid var(--pg-sidebar-border)",
          flexDirection: "column",
          zIndex: 10,
          position: "relative",
          transition: "width 0.24s cubic-bezier(0.22,1,0.36,1)",
          overflow: "hidden",
          minHeight: "100vh",
        }}
        aria-label="Workspace"
      >
        <Link
          href="/hq"
          className="pg-focus-premium"
          style={{
            padding: open ? "14px 10px 12px" : "14px 0 12px",
            display: "flex",
            alignItems: "center",
            gap: 7,
            borderBottom: border,
            flexShrink: 0,
            justifyContent: open ? "flex-start" : "center",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div className="logo-alive">
            <PeergentMark size={24} />
          </div>
          {open && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: HEAD,
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.2,
                  color: "var(--foreground)",
                }}
              >
                Peergent
              </p>
              <p style={{ fontSize: 10, color: "var(--muted-foreground)", lineHeight: 1, fontWeight: 400 }}>
                Command Center
              </p>
            </div>
          )}
        </Link>

        <div
          className="scrollbar-hide"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: open ? "8px 6px" : "8px 4px",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const NavIcon = item.Icon;
            const badge = item.id === "inbox" && inboxCount > 0 ? inboxCount : undefined;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`nav-top${active ? " active" : ""}`}
                title={!open ? item.label : undefined}
                style={{ justifyContent: open ? "flex-start" : "center" }}
              >
                <NavIcon
                  size={14}
                  strokeWidth={active ? 2 : 1.7}
                  style={{ color: active ? "var(--primary)" : undefined, flexShrink: 0 }}
                />
                {open && <span style={{ flex: 1 }}>{item.label}</span>}
                {open && badge !== undefined && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--primary)" }}>{badge}</span>
                )}
              </Link>
            );
          })}
        </div>

        <div
          style={{
            borderTop: border,
            padding: open ? "8px 8px 12px" : "8px 4px 12px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          <button
            type="button"
            className="collapse-btn"
            onClick={() => setOpen((value) => !value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 10px",
              borderRadius: 8,
              border,
              background: "transparent",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              justifyContent: open ? "space-between" : "center",
            }}
          >
            {open && <span style={{ fontSize: 11.5 }}>Collapse</span>}
            {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              borderRadius: 9,
              background: "var(--pg-user-footer-bg)",
              border,
              justifyContent: open ? "flex-start" : "center",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--pg-gradient-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>
            {open && account && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--foreground)",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {account.fullName || "Account"}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--muted-foreground)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {account.email}
                </p>
              </div>
            )}
            {open && <PgThemeToggle compact />}
          </div>
        </div>
      </nav>

      <div
        className={mainClassName ? `figma-home-workspace-shell__main ${mainClassName}` : "figma-home-workspace-shell__main scrollbar-hide"}
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          position: "relative",
          zIndex: 1,
          ...mainStyle,
        }}
      >
        {children}
      </div>

      <div
        className="figma-home-port-mobile-nav fixed bottom-0 left-0 right-0 z-30 border-t lg:hidden"
        style={{ borderColor: "var(--border)", background: "var(--sidebar)" }}
      >
        <nav className="flex items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const NavIcon = item.Icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px]"
                style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
              >
                <NavIcon size={18} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
