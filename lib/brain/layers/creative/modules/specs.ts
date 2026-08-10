/** Creative Brain module registry — thinking modules, not copy modules. */

export type CreativeModuleSpec = {
  id: string;
  title: string;
  purpose: string;
  phase: string;
};

export const CREATIVE_MODULE_SPECS: readonly CreativeModuleSpec[] = [
  {
    id: "business_understanding",
    title: "Business Understanding",
    purpose: "Ground creative in business reality before any messaging.",
    phase: "understand_business",
  },
  {
    id: "audience_understanding",
    title: "Audience Understanding",
    purpose: "Identify who receives the message and what they need to hear.",
    phase: "understand_audience",
  },
  {
    id: "positioning_engine",
    title: "Positioning Engine",
    purpose: "Find the strongest angle before generating campaigns.",
    phase: "find_positioning",
  },
  {
    id: "campaign_concept_generator",
    title: "Campaign Concept Generator",
    purpose: "Propose campaign concepts with business value and emotional triggers.",
    phase: "generate_campaign_concepts",
  },
  {
    id: "messaging_framework",
    title: "Messaging Framework",
    purpose: "Structure headline, proof, objections, and trust builders.",
    phase: "generate_messaging",
  },
  {
    id: "channel_strategy",
    title: "Channel Strategy",
    purpose: "Match channels to audience, goal, and priority — organic and paid.",
    phase: "generate_channel_strategy",
  },
  {
    id: "deliverable_specification",
    title: "Deliverable Specification",
    purpose: "Specify creative assets with variations — never publish.",
    phase: "generate_deliverables",
  },
];
