import type { CompanyProfile } from "../company/profile";
import type { WebsiteSnapshot } from "../website/types";

export type MissingInformationPriority = "critical" | "high" | "medium" | "low";

export type MissingInformationItem = {
  id: string;
  fieldKey: string;
  label: string;
  priority: MissingInformationPriority;
  reason: string;
  recommendedAction: string;
  customerImpact: string;
};

type MissingCheck = {
  id: string;
  fieldKey: string;
  label: string;
  priority: MissingInformationPriority;
  missing: (input: { profile: CompanyProfile; website: WebsiteSnapshot | null }) => boolean;
  reason: string;
  recommendedAction: string;
  customerImpact: string;
};

const CHECKS: readonly MissingCheck[] = [
  {
    id: "missing-website",
    fieldKey: "website",
    label: "Website",
    priority: "high",
    missing: ({ website }) => !website,
    reason: "No website snapshot is available.",
    recommendedAction: "Add your website URL or confirm you have no public website.",
    customerImpact: "Emma cannot align messaging with your live web presence.",
  },
  {
    id: "missing-industry",
    fieldKey: "industry",
    label: "Industry",
    priority: "high",
    missing: ({ profile }) => !profile.industry.value?.trim(),
    reason: "Industry is not confirmed.",
    recommendedAction: "Confirm your industry in company settings.",
    customerImpact: "Campaign targeting may stay generic.",
  },
  {
    id: "missing-usp",
    fieldKey: "uniqueSellingPoints",
    label: "Unique selling points",
    priority: "medium",
    missing: ({ profile }) => !profile.uniqueSellingPoints.value?.length,
    reason: "No unique selling points are recorded.",
    recommendedAction: "Add what makes your company different.",
    customerImpact: "Messaging may lack a clear wedge.",
  },
  {
    id: "missing-audience",
    fieldKey: "targetAudiences",
    label: "Target audience",
    priority: "critical",
    missing: ({ profile }) => !profile.targetAudiences.value?.length,
    reason: "Target audience is unknown.",
    recommendedAction: "Describe who you sell to.",
    customerImpact: "Emma cannot tailor campaigns to the right people.",
  },
  {
    id: "missing-competitors",
    fieldKey: "mainCompetitors",
    label: "Competitors",
    priority: "medium",
    missing: ({ profile }) => !profile.mainCompetitors.value?.length,
    reason: "No competitors are recorded.",
    recommendedAction: "Add competitors you are compared against.",
    customerImpact: "Positioning may miss competitive context.",
  },
  {
    id: "missing-tone",
    fieldKey: "tone",
    label: "Brand tone",
    priority: "medium",
    missing: ({ profile }) => !profile.tone.value?.trim(),
    reason: "Brand tone is not defined.",
    recommendedAction: "Confirm tone of voice in brand settings.",
    customerImpact: "Copy may not match your brand voice.",
  },
  {
    id: "missing-mission",
    fieldKey: "mission",
    label: "Mission",
    priority: "low",
    missing: ({ profile }) => !profile.mission.value?.trim(),
    reason: "Mission statement is missing.",
    recommendedAction: "Add your company mission.",
    customerImpact: "Narrative depth may be limited.",
  },
  {
    id: "missing-goals",
    fieldKey: "goals",
    label: "Goals",
    priority: "high",
    missing: ({ profile }) => !profile.goals.value?.length,
    reason: "Business goals are not recorded.",
    recommendedAction: "Add current marketing or business goals.",
    customerImpact: "Emma cannot prioritize outcomes.",
  },
];

export function detectMissingInformation(input: {
  profile: CompanyProfile;
  website: WebsiteSnapshot | null;
}): MissingInformationItem[] {
  return CHECKS.filter((c) => c.missing(input)).map((c) => ({
    id: c.id,
    fieldKey: c.fieldKey,
    label: c.label,
    priority: c.priority,
    reason: c.reason,
    recommendedAction: c.recommendedAction,
    customerImpact: c.customerImpact,
  }));
}

export function formatMissingInformationMessage(
  items: readonly MissingInformationItem[],
  nl: boolean
): string {
  if (items.length === 0) {
    return nl ? "Ik heb genoeg context." : "I have enough context.";
  }
  const labels = items.slice(0, 3).map((i) => i.label.toLowerCase());
  const prefix = nl ? "Ik heb nog nodig: " : "I still need: ";
  return prefix + labels.join(nl ? ", " : ", ") + (items.length > 3 ? "…" : ".");
}
