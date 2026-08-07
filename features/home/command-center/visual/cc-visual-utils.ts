import type { CSSProperties } from "react";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Euro,
  Headphones,
  Inbox,
  Megaphone,
  Target,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const CC_KPI_ICONS: Record<string, LucideIcon> = {
  "revenue-influenced": Euro,
  "time-saved": Clock3,
  "tasks-completed": CheckCircle2,
  "active-campaigns": Megaphone,
  "pending-approvals": Inbox,
  "leads-added": Users,
  "meetings-booked": CalendarDays,
  "tickets-resolved": Headphones,
  "approved-parts": CheckCircle2,
  "completed-campaigns": Target,
  "demo-revenue": TrendingUp,
  "demo-hours": Clock3,
  "demo-campaigns": Megaphone,
  "demo-leads": Users,
  "demo-tasks": BarChart3,
};

export const CC_NAV_ITEMS = [
  { id: "marketing", label: "Marketing", labelNl: "Marketing", icon: Megaphone, role: "Marketing" as const },
  { id: "sales", label: "Sales", labelNl: "Sales", icon: Target, role: "Sales" as const },
  { id: "support", label: "Support", labelNl: "Support", icon: Headphones, role: "Support" as const },
  { id: "finance", label: "Finance", labelNl: "Finance", icon: Wallet, role: "Finance" as const },
  { id: "planner", label: "Planner", labelNl: "Planner", icon: CalendarDays, role: "Planning" as const },
] as const;

export function kpiIconFor(id: string): LucideIcon {
  return CC_KPI_ICONS[id] ?? BarChart3;
}

export function statusLabel(
  tone: "working" | "waiting" | "live" | "idle",
  nl: boolean
): string {
  if (nl) {
    switch (tone) {
      case "working":
        return "Actief";
      case "waiting":
        return "Wacht";
      case "live":
        return "Live";
      default:
        return "Beschikbaar";
    }
  }
  switch (tone) {
    case "working":
      return "Working";
    case "waiting":
      return "Waiting";
    case "live":
      return "Live";
    default:
      return "Available";
  }
}

export function navAccent(role: string): string {
  switch (role) {
    case "Marketing":
      return "var(--pg-peer-marketing)";
    case "Sales":
      return "var(--pg-peer-sales)";
    case "Support":
      return "var(--pg-peer-support)";
    case "Finance":
      return "var(--pg-peer-finance)";
    case "Planning":
      return "var(--pg-peer-operations)";
    default:
      return "var(--pg-action-primary)";
  }
}

/** Peer initials from "Emma · Marketing" or plain name */
export function peerInitial(peerLabel: string): string {
  const name = peerLabel.split("·")[0]?.trim() ?? peerLabel;
  return name.charAt(0).toUpperCase();
}

export function peerDisplayName(peerLabel: string): string {
  return peerLabel.split("·")[0]?.trim() ?? peerLabel;
}

export function peerIconSurfaceStyle(accent: string): CSSProperties {
  return {
    ["--pg-cc7-icon-accent" as string]: accent,
    ["--pg-cc7-icon-bg" as string]: `linear-gradient(145deg, color-mix(in srgb, ${accent} 18%, transparent), color-mix(in srgb, ${accent} 8%, transparent))`,
  };
}

export function kpiSparklineFor(
  id: string,
  _value?: string
): readonly { value: number }[] | null {
  const curves: Record<string, number[]> = {
    "demo-revenue": [8, 9, 9.5, 10, 10.5, 11.5, 12.4],
    "demo-hours": [22, 24, 26, 28, 30, 32, 34],
    "demo-campaigns": [4, 4, 5, 5, 5, 6, 6],
    "demo-leads": [18, 20, 21, 23, 24, 26, 28],
    "revenue-influenced": [6, 7, 8, 9, 10, 11, 12],
    "time-saved": [3, 4, 4.5, 5, 5.5, 6, 6.5],
    "tasks-completed": [20, 24, 28, 30, 34, 38, 41],
    "active-campaigns": [3, 4, 4, 5, 5, 6, 6],
    "leads-added": [12, 14, 16, 18, 20, 24, 28],
  };

  const series = curves[id];
  if (!series) return null;
  return series.map((value) => ({ value }));
}

export type KpiTrendTone = "positive" | "negative" | "neutral";

/** Semantic tone from trend copy (+ / −). */
export function kpiTrendTone(trend?: string | null): KpiTrendTone {
  if (!trend?.trim()) return "neutral";
  const text = trend.trim();
  if (/^\+|\+\d/.test(text)) return "positive";
  if (/^−|^-\d|\-\d/.test(text)) return "negative";
  return "neutral";
}
