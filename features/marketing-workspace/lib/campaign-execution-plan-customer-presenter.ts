import type {
  CampaignWorkPackage,
  CampaignWorkPackagePhase,
  CampaignWorkPackageType,
} from "@/lib/campaign/planner/types";
import { CAMPAIGN_LEVEL_CHANNEL_LABEL } from "@/lib/peer-experience/marketing/campaign-onboarding/deliverable-channel-compatibility";

export type CampaignPlanPresentationContext = {
  /** Customer-selected channel labels; when set, filters deliverable rows. */
  readonly allowedChannelLabels?: ReadonlySet<string>;
};

const PLANNING_PACKAGE_TYPES = new Set<CampaignWorkPackageType>([
  "research",
  "audience_definition",
  "positioning",
  "campaign_strategy",
  "campaign_plan",
  "creative_direction",
]);

const PRODUCTION_PACKAGE_TYPES = new Set<CampaignWorkPackageType>([
  "content_creation",
  "design",
]);

const PHASE_BY_TYPE: Record<CampaignWorkPackageType, CampaignWorkPackagePhase> = {
  research: "research",
  audience_definition: "research",
  positioning: "strategy",
  campaign_strategy: "strategy",
  campaign_plan: "planning",
  creative_direction: "creative",
  content_creation: "production",
  design: "production",
  review: "review",
  publication: "publish",
  performance_monitoring: "measure",
  learning: "learn",
};

const PHASE_DISPLAY: Record<CampaignWorkPackagePhase, string> = {
  research: "Research",
  strategy: "Strategy",
  planning: "Planning",
  creative: "Creative",
  production: "Production",
  review: "Review",
  publish: "Publication",
  measure: "Performance",
  learn: "Learning",
};

export function displayPhaseLabelForPackage(pkg: CampaignWorkPackage): string {
  const phase = PHASE_BY_TYPE[pkg.type] ?? pkg.phase;
  return PHASE_DISPLAY[phase] ?? "Planning";
}

export function isPlanningPackageType(type: CampaignWorkPackageType): boolean {
  return PLANNING_PACKAGE_TYPES.has(type);
}

export function isProductionDeliverablePackage(pkg: CampaignWorkPackage): boolean {
  return PRODUCTION_PACKAGE_TYPES.has(pkg.type);
}

export function shouldIncludePackageInCustomerPlan(
  pkg: CampaignWorkPackage,
  ctx: CampaignPlanPresentationContext
): boolean {
  if (pkg.type === "content_creation" && pkg.deliverableType === "generic") {
    return false;
  }

  const channel = pkg.channel?.trim();
  if (channel && ctx.allowedChannelLabels && ctx.allowedChannelLabels.size > 0) {
    if (!ctx.allowedChannelLabels.has(channel)) {
      return false;
    }
  }

  if (pkg.phase === "production" && isPlanningPackageType(pkg.type)) {
    return false;
  }

  return true;
}

export function presentCustomerWorkItemTitle(pkg: CampaignWorkPackage): string {
  const channel = pkg.channel?.trim();
  const deliverableType = pkg.deliverableType?.trim().toLowerCase();

  if (deliverableType === "campaign_concept") {
    return "Campaign concept";
  }
  if (deliverableType === "social_post" && channel === "LinkedIn") {
    return "LinkedIn content";
  }
  if (deliverableType === "social_post" && channel === "Instagram") {
    return "Instagram content";
  }
  if (deliverableType === "email" && channel === "Email") {
    return "Email campaign";
  }
  if (deliverableType === "landing_page") {
    return channel ? `${channel} landing page` : "Landing page";
  }
  if (deliverableType === "blog_article") {
    return channel ? `${channel} blog article` : "Blog article";
  }
  if (deliverableType === "carousel" && channel) {
    return `${channel} carousel`;
  }
  if (deliverableType === "advertisement" && channel) {
    return `${channel} advertisement`;
  }
  if (deliverableType === "custom" && pkg.title?.trim()) {
    const title = pkg.title.trim();
    if (!/deliverable/i.test(title)) return title;
  }

  const raw = pkg.title?.trim() ?? "";
  if (/deliverable/i.test(raw) && channel) {
    return `${channel} content`;
  }

  return raw || "Campaign deliverable";
}

export function presentCustomerOwnerLine(pkg: CampaignWorkPackage): string {
  if (pkg.recommendedOwner.role === "customer") return "You";
  return "Marketing Peer";
}

export function presentCustomerCompactMeta(
  pkg: CampaignWorkPackage,
  ownerLine: string
): string | undefined {
  if (isProductionDeliverablePackage(pkg)) {
    const channel = pkg.channel?.trim();
    if (channel && channel !== CAMPAIGN_LEVEL_CHANNEL_LABEL) {
      return `${ownerLine === "You" ? "Owner: You" : "Owner: Marketing Peer"} · ${channel}`;
    }
  }
  return ownerLine === "You" ? "Owner: You" : "Owner: Marketing Peer";
}

export function isActionableOptionalImprovement(message: string): boolean {
  const lower = message.toLowerCase();
  if (lower.includes("is not planned for")) return false;
  if (lower.includes("could not be matched to your selected channels")) return false;
  return true;
}

export function buildAllowedChannelLabelsFromSetup(
  labels: readonly string[]
): ReadonlySet<string> {
  const set = new Set<string>(labels);
  set.add(CAMPAIGN_LEVEL_CHANNEL_LABEL);
  return set;
}
