import type { CampaignReviewArtifactType } from "../campaign-review/campaign-review-types";
import type {
  CampaignPublishTargetId,
  CampaignPublishTargetViewModel,
  CampaignPublishTargetsViewModel,
} from "./campaign-collaboration-types";

const ALL_TARGETS: readonly Omit<CampaignPublishTargetViewModel, "linkedArtifactTypes">[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Organic posts and thought leadership",
    futureDestination: true,
  },
  {
    id: "email",
    label: "Email",
    description: "Newsletter and lifecycle email sends",
    futureDestination: true,
  },
  {
    id: "website",
    label: "Website",
    description: "Landing pages and site updates",
    futureDestination: true,
  },
  {
    id: "blog",
    label: "Blog",
    description: "Long-form articles and SEO content",
    futureDestination: true,
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Social posts and community updates",
    futureDestination: true,
  },
  {
    id: "google_business",
    label: "Google Business",
    description: "Local presence and updates",
    futureDestination: true,
  },
  {
    id: "newsletter",
    label: "Newsletter",
    description: "Subscriber newsletter editions",
    futureDestination: true,
  },
];

const TARGET_ARTIFACTS: Record<CampaignPublishTargetId, readonly CampaignReviewArtifactType[]> = {
  linkedin: ["linkedin_post"],
  email: ["email_campaign"],
  website: ["campaign_strategy", "creative_direction"],
  blog: ["campaign_strategy", "creative_direction"],
  facebook: ["linkedin_post", "creative_direction"],
  google_business: ["campaign_strategy"],
  newsletter: ["email_campaign", "campaign_strategy"],
};

export function buildCampaignPublishTargetsViewModel(input: {
  artifactTypesPresent: readonly CampaignReviewArtifactType[];
}): CampaignPublishTargetsViewModel {
  const present = new Set(input.artifactTypesPresent);
  const targets: CampaignPublishTargetViewModel[] = ALL_TARGETS.map((target) => ({
    ...target,
    linkedArtifactTypes: TARGET_ARTIFACTS[target.id].filter((t) => present.has(t)),
  })).filter((t) => t.linkedArtifactTypes.length > 0 || t.id === "website" || t.id === "blog");

  const withLinks =
    targets.length > 0
      ? targets
      : ALL_TARGETS.slice(0, 3).map((t) => ({
          ...t,
          linkedArtifactTypes: [] as readonly CampaignReviewArtifactType[],
        }));

  return {
    customerHeading: "Future publish destinations",
    targets: withLinks,
  };
}
