export type PeerRow = {
  id: string;
  name: string;
  role: string;
  website: string;
  objective: string;
  status: string;
  created_at?: string;
  organization_id?: string | null;
};

type PeerRoleConfig = {
  roleLabel: string;
  gradient: string;
  workingStatus: string;
  activity: string;
  stats: { label: string; value: string }[];
};

const DEFAULT_ROLE_CONFIG: PeerRoleConfig = {
  roleLabel: "Custom AI peer",
  gradient: "from-slate-500 to-slate-700",
  workingStatus: "Ready to assist your team",
  activity: "Recently created",
  stats: [
    { label: "Tasks", value: "0" },
    { label: "Completed", value: "0" },
    { label: "Active", value: "0" },
  ],
};

export const PEER_ROLES = [
  "Sales",
  "Support",
  "Marketing",
  "Planning",
  "Finance",
  "Custom",
] as const;

export const PEER_STATUSES = ["active", "inactive"] as const;

const ROLE_CONFIG: Record<string, PeerRoleConfig> = {
  Sales: {
    roleLabel: "Sales & lead qualification",
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

export function getRoleConfig(role: string): PeerRoleConfig {
  return ROLE_CONFIG[role] ?? DEFAULT_ROLE_CONFIG;
}
