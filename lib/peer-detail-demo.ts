export type DemoActivity = {
  time: string;
  action: string;
};

export type DemoKnowledgeSource = {
  name: string;
  type: string;
  updated: string;
};

export type DemoConversation = {
  contact: string;
  channel: string;
  preview: string;
  time: string;
};

export type DemoApprovalItem = {
  title: string;
  description: string;
  requestedAt: string;
};

export type DemoSetting = {
  label: string;
  description: string;
  enabled: boolean;
};

export type DemoTool = {
  name: string;
  connected: boolean;
};

export function getDemoActivity(role: string): DemoActivity[] {
  const leadAction =
    role === "Sales"
      ? "Qualified lead from website chat"
      : role === "Support"
        ? "Resolved warranty question"
        : role === "Marketing"
          ? "Published LinkedIn post draft"
          : role === "Planning"
            ? "Scheduled product demo"
            : "Completed assigned task";

  return [
    { time: "10:16", action: leadAction },
    { time: "09:52", action: "Updated knowledge from company website" },
    { time: "09:41", action: "Handed off item for human review" },
    { time: "09:18", action: "Started daily performance check-in" },
  ];
}

export function getDemoInstructions(role: string): string[] {
  const instructions: Record<string, string[]> = {
    Sales: [
      "Qualify inbound visitors using the company website and product pages.",
      "Book meetings only when budget and timeline are confirmed.",
      "Escalate enterprise deals to a human account executive.",
    ],
    Support: [
      "Answer customer questions using approved knowledge sources.",
      "Never promise refunds without human approval.",
      "Escalate unresolved issues after two follow-up attempts.",
    ],
    Marketing: [
      "Draft on-brand content aligned with current campaigns.",
      "Submit all public posts for human review before publishing.",
      "Track engagement metrics and summarize weekly performance.",
    ],
    Planning: [
      "Check calendar availability before proposing meeting times.",
      "Send reminders 24 hours and 1 hour before appointments.",
      "Route scheduling conflicts to a human coordinator.",
    ],
    Finance: [
      "Prepare weekly summaries from connected finance tools.",
      "Flag anomalies or unusual transactions for review.",
      "Never approve payments without human authorization.",
    ],
  };

  return (
    instructions[role] ?? [
      "Follow the peer objective and company guidelines at all times.",
      "Escalate uncertain decisions to a human manager.",
      "Keep activity logs up to date throughout the day.",
    ]
  );
}

export const DEMO_KNOWLEDGE: DemoKnowledgeSource[] = [
  { name: "Company website", type: "Website", updated: "Synced 2h ago" },
  { name: "Product FAQ", type: "Document", updated: "Updated yesterday" },
  { name: "Pricing & packages", type: "Document", updated: "Updated 3 days ago" },
];

export const DEMO_TOOLS: DemoTool[] = [
  { name: "Google Calendar", connected: true },
  { name: "Slack", connected: true },
  { name: "HubSpot CRM", connected: false },
  { name: "Gmail", connected: false },
];

export const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    contact: "Sarah van Dijk",
    channel: "Website chat",
    preview: "Can you tell me more about your enterprise plan?",
    time: "12 min ago",
  },
  {
    contact: "Mark Jansen",
    channel: "Email",
    preview: "Following up on the demo we scheduled last week.",
    time: "1h ago",
  },
  {
    contact: "Unknown visitor",
    channel: "Website chat",
    preview: "What are your support hours?",
    time: "2h ago",
  },
];

export const DEMO_APPROVALS: DemoApprovalItem[] = [
  {
    title: "Approve meeting with Solar BV",
    description: "Peer wants to book a 45-minute sales call for Friday at 14:00.",
    requestedAt: "8 min ago",
  },
  {
    title: "Review outbound email draft",
    description: "Follow-up email to a qualified lead awaiting manager approval.",
    requestedAt: "34 min ago",
  },
];

export const DEMO_SETTINGS: DemoSetting[] = [
  {
    label: "Auto-respond to website visitors",
    description: "Allow this peer to reply without manual approval.",
    enabled: true,
  },
  {
    label: "Require approval for bookings",
    description: "Meetings must be approved by a human first.",
    enabled: true,
  },
  {
    label: "Use company knowledge base",
    description: "Answer questions using synced knowledge sources.",
    enabled: true,
  },
  {
    label: "Weekend availability",
    description: "Keep this peer active outside business hours.",
    enabled: false,
  },
];
