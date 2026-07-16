import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CalendarDays,
  Headphones,
  Megaphone,
  TrendingUp,
} from "lucide-react";

export type PeerRow = {
  id: string;
  name: string;
  role: string;
  website: string;
  objective: string;
  status: string;
  created_at?: string;
};

type PeerRoleConfig = {
  roleLabel: string;
  icon: LucideIcon;
  gradient: string;
  workingStatus: string;
  activity: string;
  stats: { label: string; value: string }[];
};

const DEFAULT_ROLE_CONFIG: PeerRoleConfig = {
  roleLabel: "Custom AI peer",
  icon: Bot,
  gradient: "from-slate-500 to-slate-700",
  workingStatus: "Ready to assist your team",
  activity: "Recently created",
  stats: [
    { label: "Tasks", value: "0" },
    { label: "Completed", value: "0" },
    { label: "Active", value: "0" },
  ],
};

const ROLE_CONFIG: Record<string, PeerRoleConfig> = {
  Sales: {
    roleLabel: "Sales & lead qualification",
    icon: TrendingUp,
    gradient: "from-violet-500 to-blue-600",
    workingStatus: "Talking to a website visitor",
    activity: "Active 12 seconds ago",
    stats: [
      { label: "Conversations", value: "19" },
      { label: "Qualified leads", value: "6" },
      { label: "Meetings", value: "3" },
    ],
  },
  Support: {
    roleLabel: "Customer support",
    icon: Headphones,
    gradient: "from-cyan-500 to-blue-600",
    workingStatus: "Answering a warranty question",
    activity: "Active 28 seconds ago",
    stats: [
      { label: "Questions", value: "54" },
      { label: "Resolved", value: "98%" },
      { label: "Rating", value: "4.9" },
    ],
  },
  Marketing: {
    roleLabel: "Content & campaigns",
    icon: Megaphone,
    gradient: "from-fuchsia-500 to-violet-600",
    workingStatus: "Creating a LinkedIn post",
    activity: "Active 1 minute ago",
    stats: [
      { label: "Posts", value: "3" },
      { label: "Campaigns", value: "2" },
      { label: "Engagements", value: "156" },
    ],
  },
  Planning: {
    roleLabel: "Scheduling & reminders",
    icon: CalendarDays,
    gradient: "from-orange-500 to-pink-600",
    workingStatus: "Checking calendar availability",
    activity: "Active 2 minutes ago",
    stats: [
      { label: "Appointments", value: "4" },
      { label: "Reminders", value: "12" },
      { label: "Rescheduled", value: "2" },
    ],
  },
  Finance: {
    roleLabel: "Finance & reporting",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-600",
    workingStatus: "Reviewing financial reports",
    activity: "Active 5 minutes ago",
    stats: [
      { label: "Reports", value: "0" },
      { label: "Invoices", value: "0" },
      { label: "Processed", value: "0" },
    ],
  },
  Custom: DEFAULT_ROLE_CONFIG,
};

export type DisplayPeer = {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: LucideIcon;
  status: string;
  stats: { label: string; value: string }[];
  activity: string;
  gradient: string;
  isActive: boolean;
};

export function mapPeerToDisplay(peer: PeerRow): DisplayPeer {
  const config = ROLE_CONFIG[peer.role] ?? DEFAULT_ROLE_CONFIG;

  return {
    id: peer.id,
    name: peer.name,
    role: config.roleLabel,
    description: peer.objective,
    icon: config.icon,
    status: config.workingStatus,
    stats: config.stats,
    activity: config.activity,
    gradient: config.gradient,
    isActive: peer.status === "active",
  };
}
