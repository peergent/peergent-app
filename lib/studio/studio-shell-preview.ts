import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import { buildMarketingViewModel, type PeerViewModel } from "@/lib/peer-experience";
import type { PeerRow } from "@/lib/peer-display";
import { resolveCampaignTitle } from "@/lib/peer-experience/marketing/resolve-campaign-title";
import {
  buildProgressRailViewModel,
  type ProgressRailViewModel,
} from "@/lib/peer-experience/marketing/build-progress-rail-view-model";
import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import type { ConversationMessage } from "@/lib/marketing-workspace/experience";

export type StudioShellPreviewScene = "idle" | "review" | "working";

export type StudioShellPreviewFixture = {
  scene: StudioShellPreviewScene;
  peer: PeerRow;
  understanding: MarketingUnderstanding;
  strategy: MarketingStrategy;
  plan: MarketingPlan;
  drafts: MarketingContentDraft[];
  generating: GeneratingActivity | null;
  generatingActivity?: string;
  viewModel: PeerViewModel;
  campaignTitle: string;
  progressRail: ProgressRailViewModel;
  statusLine: string;
  conversationSeed: ConversationMessage[];
};

export const STUDIO_SHELL_PREVIEW_SCENES: StudioShellPreviewScene[] = [
  "idle",
  "review",
  "working",
];

const previewPeer: PeerRow = {
  id: "preview-maya",
  name: "Maya",
  role: "Marketing",
  website: "https://acme.example",
  objective: "Grow demand",
  status: "active",
};

const understanding: MarketingUnderstanding = {
  available: true,
  sparse: false,
  completeness: 82,
  gaps: [],
  brand: {
    values: [],
    toneOfVoice: {},
    keyMessages: ["Clear, confident, human"],
    positioningStatement: "We help growing teams ship marketing that converts.",
  },
  products: [{ id: "1", name: "Peergent Platform" }],
  services: [],
  customerSegments: [{ id: "1", name: "SMB founders", painPoints: [], buyingTriggers: [] }],
  competitors: [],
  goals: [{ id: "1", title: "Launch Q2 campaign", status: "active", priority: 1 }],
  existingContent: [],
  assembledAt: new Date().toISOString(),
};

const strategy: MarketingStrategy = {
  summary: "Lead with product proof and founder stories on LinkedIn.",
  confidence: "high",
  confidenceReason: "Strong company context",
  targetAudiences: [],
  positioningRecommendations: [],
  contentPillars: [],
  campaignIdeas: [
    {
      name: "Q2 Product Launch",
      objective: "Drive trial signups",
      channels: ["LinkedIn"],
      rationale: { why: "Audience is active on LinkedIn", basedOn: ["company-dna"] },
    },
  ],
  seoOpportunities: [],
  socialMediaStrategy: [],
  customerJourneyRecommendations: [],
  leadGenerationOpportunities: [],
  marketingPriorities: [],
  knowledgeGaps: [],
  generatedAt: new Date().toISOString(),
};

const plan: MarketingPlan = {
  summary: "Four-week launch sequence with LinkedIn-first content.",
  confidence: "high",
  confidenceReason: "Aligned to strategy",
  basedOnStrategySummary: strategy.summary,
  objectives: [],
  priorities: [],
  timeline: [],
  campaigns: [
    {
      title: "Q2 Product Launch",
      channels: ["LinkedIn"],
      startWeek: 1,
      endWeek: 4,
      milestones: ["Draft launch post", "Publish"],
      rationale: { why: "Primary launch vehicle" },
      linkedStrategyItems: [],
      estimatedEffort: "medium",
      expectedImpact: "high",
    },
  ],
  contentCalendar: [
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
      scheduledWeek: 2,
      rationale: { why: "Announce the launch to ICP" },
      linkedStrategyItems: [],
      estimatedEffort: "medium",
      expectedImpact: "high",
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: new Date().toISOString(),
};

const reviewDraft: MarketingContentDraft = {
  id: "preview-draft-1",
  planActivityReference: "LinkedIn launch post",
  contentType: "linkedin_post",
  objective: "Announce Q2 launch",
  title: "LinkedIn launch post",
  body: "We built Peergent so marketing teams can delegate real work — not just prompts.\n\nThis week we're opening our Q2 launch sequence. If you're tired of AI dashboards that feel like admin panels, this is for you.\n\n→ Comment LAUNCH and we'll send the early access brief.",
  keywords: ["AI marketing", "launch"],
  rationale: {
    why: "Direct CTA for ICP founders",
    planActivityReference: "LinkedIn launch post",
    strategyLinks: [],
  },
  sourceReferences: [],
  confidence: "high",
  status: "draft",
  warnings: [],
  generatedAt: new Date().toISOString(),
};

const baseExtras = {
  profileCounts: { goals: 2, content: 4 },
  activityFeed: [],
  publicationPackages: [],
  selectedTimelineNodeId: null as string | null,
};

function buildFixture(input: {
  scene: StudioShellPreviewScene;
  drafts: MarketingContentDraft[];
  generating: GeneratingActivity | null;
  generatingActivity?: string;
}): StudioShellPreviewFixture {
  const viewModel = buildMarketingViewModel({
    understanding,
    strategy,
    plan,
    drafts: input.drafts,
    generating: input.generating,
    generatingActivity: input.generatingActivity,
    ...baseExtras,
  });

  return {
    scene: input.scene,
    peer: previewPeer,
    understanding,
    strategy,
    plan,
    drafts: input.drafts,
    generating: input.generating,
    generatingActivity: input.generatingActivity,
    viewModel,
    campaignTitle: resolveCampaignTitle(plan, strategy),
    progressRail: buildProgressRailViewModel({
      understanding,
      timeline: viewModel.timeline,
      deliverable: viewModel.deliverable,
      generating: input.generating,
    }),
    statusLine: viewModel.now.presenceLine,
    conversationSeed: [],
  };
}

export function studioShellPreviewFixture(
  scene: StudioShellPreviewScene
): StudioShellPreviewFixture {
  switch (scene) {
    case "idle":
      return buildFixture({
        scene,
        drafts: [],
        generating: null,
      });
    case "review":
      return buildFixture({
        scene,
        drafts: [reviewDraft],
        generating: null,
      });
    case "working":
      return buildFixture({
        scene,
        drafts: [],
        generating: "draft",
        generatingActivity: "LinkedIn launch post",
      });
  }
}

export function isStudioShellPreviewScene(
  value: string | null | undefined
): value is StudioShellPreviewScene {
  return STUDIO_SHELL_PREVIEW_SCENES.includes(value as StudioShellPreviewScene);
}
