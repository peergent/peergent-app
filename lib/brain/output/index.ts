/**
 * Brain Output Layer — public API.
 *
 * Brains publish BrainStructuredOutput. This layer derives customer intelligence.
 * Office surfaces consume ONLY mapped slices from this layer.
 */

export type {
  BrainSource,
  ConfidenceScore,
  ExecutiveSummary,
  BusinessIntelligence,
  BusinessIntelligenceBullet,
  BusinessIntelligenceBulletTone,
  BrainOutputRecommendation,
  ContextGap,
  BusinessRisk,
  BusinessOpportunity,
  RecentDiscovery,
  RecentDecision,
  RecentLearning,
  SuggestedAction,
  LiveActivityEvent,
  ProgressStepNarrative,
  ProgressNarrative,
  ProgressStepState,
  CampaignNarrative,
  ApprovalReason,
  ExpectedBusinessImpact,
  MissingContext,
  BrainOutputSource,
  ValidationQualitySummary,
  ValidationRequiredFixOutput,
  CampaignBrainOutput,
  WorkspaceBrainOutput,
} from "./types";

export type {
  BrainPresentationContext,
  CampaignBrainPresentationContext,
} from "./presentation-context";
export { resolveBrainPresentationContext } from "./presentation-context";

export { sanitizeCustomerText, customerTextOrFallback } from "./sanitize";
export { capabilityToBrainSource } from "./capability-source";

export { publishExecutiveSummary, publishCampaignNarrative } from "./publish/executive-summary";
export { publishBusinessIntelligence } from "./publish/business-intelligence";
export { publishRecommendations, publishSuggestedActions } from "./publish/recommendations";
export { publishProgressNarrative } from "./publish/progress-narrative";
export {
  publishActivityEvents,
  publishRecentDiscoveries,
  publishRecentDecisions,
  publishRecentLearnings,
} from "./publish/activity-events";

export { buildCampaignBrainOutput } from "./aggregate/build-campaign-brain-output";
export { resolveCampaignBrainOutput } from "./resolve-campaign-brain-output";
export { resolveWorkspaceBrainOutput } from "./resolve-workspace-brain-output";
export { buildDemoCampaignBrainOutput, buildDemoWorkspaceBrainOutput } from "./demo/demo-brain-output";
