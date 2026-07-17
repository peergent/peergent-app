import type {
  ApprovalItem,
  AutonomyOption,
  AvailabilityOption,
  CurrentWorkModel,
  DecisionLogEntry,
  RoleProfileContent,
} from "./types";

export type RoleWorkspaceContent = {
  department: string;
  roleDescription: string;
  currentWorkActive: CurrentWorkModel;
  currentWorkIdle: CurrentWorkModel;
  decisionLog: DecisionLogEntry[];
  approvals: ApprovalItem[];
  profile: RoleProfileContent;
};

export const AVAILABILITY_OPTIONS: AvailabilityOption[] = [
  {
    id: "business-hours",
    label: "Business hours",
    description: "Works during office hours.",
  },
  {
    id: "extended",
    label: "Extended hours",
    description: "Keeps working after your team goes home.",
  },
  {
    id: "24-7",
    label: "24/7",
    description: "Always available for customers.",
  },
];

export const AUTONOMY_OPTIONS: AutonomyOption[] = [
  {
    id: "assist",
    label: "Assist",
    summary: "Prepares work for you — nothing reaches customers without sign-off.",
    canDo: [
      "Draft replies and meeting summaries",
      "Research leads and update CRM notes",
      "Flag opportunities for your review",
    ],
    needsApproval: [
      "Every customer-facing message",
      "Meeting bookings and follow-ups",
      "Discounts or pricing changes",
    ],
    neverAutomatic: [
      "Changing published pricing",
      "Committing to contracts",
      "Sending proposals without review",
    ],
  },
  {
    id: "collaborate",
    label: "Collaborate",
    summary: "Handles routine work alone and checks in when something is uncertain.",
    canDo: [
      "Answer common product questions",
      "Qualify leads and enrich CRM records",
      "Schedule meetings within agreed rules",
    ],
    needsApproval: [
      "Discounts and custom packages",
      "Enterprise deals and exceptions",
      "Public-facing content",
    ],
    neverAutomatic: [
      "Changing pricing policy",
      "Waiving contractual terms",
      "Bypassing compliance checks",
    ],
  },
  {
    id: "autopilot",
    label: "Autopilot",
    summary: "Acts within your guardrails — you only hear about exceptions.",
    canDo: [
      "Qualify and nurture inbound leads end-to-end",
      "Send approved follow-up sequences",
      "Book meetings when confidence is high",
    ],
    needsApproval: [
      "Non-standard pricing",
      "High-value enterprise opportunities",
      "Policy edge cases",
    ],
    neverAutomatic: [
      "Discounts above your defined limit",
      "Legal or contractual commitments",
      "Overrides to pricing policy",
    ],
  },
];

const ROLE_CONTENT: Record<string, RoleWorkspaceContent> = {
  Sales: {
    department: "Revenue",
    roleDescription:
      "Turns website visitors into qualified sales conversations.",
    currentWorkActive: {
      isActive: true,
      objective: "Qualifying ACME Solar",
      reasoning:
        "The customer is comparing two installation options and asked about timelines.",
      confidence: "High",
      waitingFor: "Customer reply",
      estimatedCompletion: "Under one minute",
    },
    currentWorkIdle: {
      isActive: false,
      objective: "Ready for the next conversation",
      reasoning: "No active visitor right now — monitoring your website.",
      confidence: "Ready",
      waitingFor: "New visitor",
      estimatedCompletion: "",
    },
    decisionLog: [
      {
        id: "d-s-1",
        time: "09:23",
        explanation:
          "Scheduled a meeting because confidence exceeded threshold and budget was confirmed.",
      },
      {
        id: "d-s-2",
        time: "09:18",
        explanation:
          "Requested approval before offering a discount — pricing policy requires manager sign-off.",
      },
      {
        id: "d-s-3",
        time: "09:14",
        explanation:
          "Qualified the visitor because annual usage exceeds 9,000 kWh.",
      },
      {
        id: "d-s-4",
        time: "08:52",
        explanation:
          "Escalated an enterprise enquiry — deal size exceeds autonomous booking limit.",
      },
    ],
    approvals: [
      {
        id: "ap-s-1",
        title: "Send proposal to ACME Solar",
        context: "Custom package quote for 12-panel residential install.",
        reason: "Proposals above €8,000 require manager sign-off.",
        requestedAt: "8 min ago",
      },
      {
        id: "ap-s-2",
        title: "Offer 5% discount",
        context: "Visitor requested a loyalty incentive before booking.",
        reason: "Discounts need your approval per pricing policy.",
        requestedAt: "34 min ago",
      },
    ],
    profile: {
      expertise: [
        "Products",
        "Pricing",
        "Lead qualification",
        "CRM",
        "Customer objections",
        "Tone of voice",
      ],
      workingStyle: [
        "Consultative",
        "Patient",
        "Fast responder",
        "Structured",
        "Professional",
      ],
      experienceTemplate: [
        { label: "Working since" },
        { label: "Handled" },
        { label: "Qualified" },
        { label: "Booked" },
      ],
      experienceValues: {
        Handled: "127 conversations",
        Qualified: "39 leads",
        Booked: "18 meetings",
      },
      learning: [
        {
          id: "l-s-1",
          text: "Learned that existing customers prefer shorter emails.",
        },
        {
          id: "l-s-2",
          text: "Improved product matching for solar installations.",
        },
        {
          id: "l-s-3",
          text: "Updated understanding of pricing rules.",
        },
        {
          id: "l-s-4",
          text: "Recognised three new objection patterns.",
        },
      ],
      reputation: [
        { label: "Reliability", value: "Excellent" },
        { label: "Manager feedback", value: "Positive" },
        { label: "Escalation rate", value: "Low" },
        { label: "Policy compliance", value: "100%" },
      ],
    },
  },
  Marketing: {
    department: "Marketing",
    roleDescription:
      "Creates campaigns, drafts content, and keeps your brand visible.",
    currentWorkActive: {
      isActive: true,
      objective: "Refining tomorrow's LinkedIn campaign",
      reasoning:
        "Engagement dropped last week — adjusting the hook for SME decision-makers.",
      confidence: "High",
      waitingFor: "Your review",
      estimatedCompletion: "About 2 minutes",
    },
    currentWorkIdle: {
      isActive: false,
      objective: "Ready for the next brief",
      reasoning: "Campaign queue is clear — standing by for new work.",
      confidence: "Ready",
      waitingFor: "Next assignment",
      estimatedCompletion: "",
    },
    decisionLog: [
      {
        id: "d-m-1",
        time: "10:08",
        explanation:
          "Submitted post for approval — all public content requires your review.",
      },
      {
        id: "d-m-2",
        time: "09:41",
        explanation:
          "Recommended A/B test because CTR declined 12% week over week.",
      },
      {
        id: "d-m-3",
        time: "09:22",
        explanation:
          "Drafted three content ideas aligned with the Q3 product launch theme.",
      },
    ],
    approvals: [
      {
        id: "ap-m-1",
        title: "Publish tomorrow's LinkedIn post",
        context: "Product spotlight post targeting SME decision-makers.",
        reason: "All public posts require your review before publishing.",
        requestedAt: "15 min ago",
      },
      {
        id: "ap-m-2",
        title: "Launch campaign",
        context: "Retargeting campaign for website visitors who viewed pricing.",
        reason: "Campaign launches need manager approval.",
        requestedAt: "1 hr ago",
      },
    ],
    profile: {
      expertise: [
        "Copywriting",
        "Campaign strategy",
        "Brand voice",
        "LinkedIn",
        "Content calendars",
        "Audience targeting",
      ],
      workingStyle: [
        "Creative",
        "Brand-conscious",
        "Analytical",
        "Structured",
        "Calm",
      ],
      experienceTemplate: [
        { label: "Working since" },
        { label: "Handled" },
        { label: "Drafted" },
        { label: "Published" },
      ],
      experienceValues: {
        Handled: "48 campaigns",
        Drafted: "62 posts",
        Published: "22 pieces",
      },
      learning: [
        {
          id: "l-m-1",
          text: "Learned that Tuesday posts outperform Thursday for your audience.",
        },
        {
          id: "l-m-2",
          text: "Refined headline style based on last month's engagement.",
        },
        {
          id: "l-m-3",
          text: "Updated understanding of brand tone for SME buyers.",
        },
      ],
      reputation: [
        { label: "Reliability", value: "Excellent" },
        { label: "Manager feedback", value: "Positive" },
        { label: "Escalation rate", value: "Low" },
        { label: "Policy compliance", value: "100%" },
      ],
    },
  },
  Support: {
    department: "Customer Success",
    roleDescription:
      "Resolves customer questions and keeps satisfaction high.",
    currentWorkActive: {
      isActive: true,
      objective: "Answering a warranty question",
      reasoning:
        "Customer asked about inverter coverage after five years — checking policy before replying.",
      confidence: "High",
      waitingFor: "Policy confirmation",
      estimatedCompletion: "Under one minute",
    },
    currentWorkIdle: {
      isActive: false,
      objective: "Ready for the next question",
      reasoning: "Monitoring support channels for incoming requests.",
      confidence: "Ready",
      waitingFor: "Customer message",
      estimatedCompletion: "",
    },
    decisionLog: [
      {
        id: "d-u-1",
        time: "09:35",
        explanation:
          "Escalated billing issue — refunds require your authorization.",
      },
      {
        id: "d-u-2",
        time: "09:12",
        explanation:
          "Resolved warranty question using approved FAQ — no escalation needed.",
      },
    ],
    approvals: [
      {
        id: "ap-u-1",
        title: "Approve refund request",
        context: "Customer requesting partial refund on delayed shipment.",
        reason: "Refunds require your authorization.",
        requestedAt: "25 min ago",
      },
    ],
    profile: {
      expertise: [
        "Product FAQ",
        "Warranty terms",
        "Return policy",
        "Escalation paths",
        "Tone of voice",
      ],
      workingStyle: ["Empathetic", "Patient", "Professional", "Calm"],
      experienceTemplate: [
        { label: "Working since" },
        { label: "Handled" },
        { label: "Resolved" },
      ],
      experienceValues: {
        Handled: "312 questions",
        Resolved: "98%",
      },
      learning: [
        {
          id: "l-u-1",
          text: "Learned that customers appreciate acknowledging wait times upfront.",
        },
        {
          id: "l-u-2",
          text: "Improved routing for billing-related enquiries.",
        },
      ],
      reputation: [
        { label: "Reliability", value: "Excellent" },
        { label: "Manager feedback", value: "Positive" },
        { label: "Escalation rate", value: "Low" },
        { label: "Policy compliance", value: "100%" },
      ],
    },
  },
};

const DEFAULT_CONTENT: RoleWorkspaceContent = {
  department: "Operations",
  roleDescription: "Supports your team with focused, reliable work.",
  currentWorkActive: {
    isActive: true,
    objective: "Working on assigned tasks",
    reasoning: "Processing items from your team's priority queue.",
    confidence: "Medium",
    waitingFor: "Task completion",
    estimatedCompletion: "A few minutes",
  },
  currentWorkIdle: {
    isActive: false,
    objective: "Ready for the next assignment",
    reasoning: "Standing by until your team needs support.",
    confidence: "Ready",
    waitingFor: "New task",
    estimatedCompletion: "",
  },
  decisionLog: [
    {
      id: "d-d-1",
      time: "09:00",
      explanation: "Completed assigned task and sent summary to team inbox.",
    },
  ],
  approvals: [],
  profile: {
    expertise: ["Company website", "Team objectives", "Operating guidelines"],
    workingStyle: ["Professional", "Reliable", "Structured"],
    experienceTemplate: [{ label: "Working since" }, { label: "Handled" }],
    experienceValues: { Handled: "24 tasks" },
    learning: [
      {
        id: "l-d-1",
        text: "Learning your team's preferred handover format.",
      },
    ],
    reputation: [
      { label: "Reliability", value: "Good" },
      { label: "Policy compliance", value: "100%" },
    ],
  },
};

export function getRoleWorkspaceContent(role: string): RoleWorkspaceContent {
  return ROLE_CONTENT[role] ?? DEFAULT_CONTENT;
}

export function buildExperienceItems(
  content: RoleWorkspaceContent,
  workingSince: string
): { label: string; value: string }[] {
  return content.profile.experienceTemplate.map((item) => ({
    label: item.label,
    value:
      item.label === "Working since"
        ? workingSince
        : (content.profile.experienceValues[item.label] ?? "—"),
  }));
}
