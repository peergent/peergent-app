/** Static mock data for HQ design previews — not live production data. */

export type HqSpecialistPreview = {
  id: string;
  name: string;
  role: string;
  activity: string;
  state: "Working" | "Monitoring" | "Waiting for review" | "Healthy" | "Needs attention" | "Paused" | "Not configured";
  attention: boolean;
  destinationLabel: string;
};

export const HQ_PREVIEW_USER = "Djemo";

export const HQ_GREETING = {
  headline: "Good morning, Djemo.",
  supporting: "Your digital colleagues have been working while you were away.",
};

export const HQ_MANAGER = {
  name: "Jordan",
  role: "Manager Peer",
  state: "Your briefing is ready.",
  cta: "Read briefing",
  destinationLabel: "Manager briefing environment",
};

export const HQ_BRIEFING_ITEMS = [
  "Emma prepared two marketing campaigns.",
  "One Instagram post is waiting for approval.",
  "Sales qualified six new leads.",
  "Finance detected one overdue invoice.",
  "Support has no urgent issues.",
];

export const HQ_BUSINESS_HEALTH = {
  label: "Business pulse",
  summary: "Most areas are on track. Marketing and Finance need a quick look.",
  scoreLabel: "4 of 5 peers healthy",
};

export const HQ_SPECIALISTS: HqSpecialistPreview[] = [
  {
    id: "emma",
    name: "Emma",
    role: "Marketing",
    activity: "Preparing summer campaign",
    state: "Needs attention",
    attention: true,
    destinationLabel: "Emma's Marketing workspace",
  },
  {
    id: "alex",
    name: "Alex",
    role: "Sales",
    activity: "6 leads qualified",
    state: "Working",
    attention: false,
    destinationLabel: "Sales workspace",
  },
  {
    id: "finn",
    name: "Finn",
    role: "Finance",
    activity: "Cash flow healthy",
    state: "Monitoring",
    attention: true,
    destinationLabel: "Finance workspace",
  },
  {
    id: "maya",
    name: "Maya",
    role: "Support",
    activity: "No urgent conversations",
    state: "Healthy",
    attention: false,
    destinationLabel: "Support workspace",
  },
  {
    id: "noah",
    name: "Noah",
    role: "Operations",
    activity: "Reviewing next week's schedule",
    state: "Working",
    attention: false,
    destinationLabel: "Operations workspace",
  },
];

export const HQ_CONCEPTS = [
  {
    id: "a",
    slug: "hq-a",
    title: "Executive HQ",
    summary: "Greeting and briefing at the top. Manager as primary central card. Specialists beneath.",
  },
  {
    id: "b",
    slug: "hq-b",
    title: "Living Organization",
    summary: "Manager at center with peers orbiting. Animated communication paths.",
  },
  {
    id: "c",
    slug: "hq-c",
    title: "Manager Desk",
    summary: "Briefing column beside a structured team panel. Daily-use oriented.",
  },
  {
    id: "d",
    slug: "hq-d",
    title: "Business Command View",
    summary: "Manager status + business health. Peers sorted by urgency.",
  },
] as const;
