export type {
  MarketingWorkspacePersistedState,
  MarketingWorkspacePhase,
  MarketingWorkspaceSnapshot,
  RecommendedAction,
} from "./types";

export {
  loadMarketingWorkspaceState,
  saveMarketingWorkspaceState,
  upsertDraft,
} from "./storage";

export {
  fetchMarketingUnderstanding,
  fetchMarketingProfile,
  generateMarketingStrategy,
  generateMarketingPlan,
  generateContentDraft,
} from "./api";

export {
  buildRecommendedActions,
  collectWorkspaceWarnings,
  deriveWorkspacePhase,
} from "./recommendations";

export * from "./experience";
