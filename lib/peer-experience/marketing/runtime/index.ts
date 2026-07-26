export { executeMarketingWorkUnit, CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "./execute-marketing-work-unit";
export { MarketingWorkUnitRuntimeError } from "./errors";
export type { MarketingWorkUnitRuntimeErrorCode } from "./errors";
export {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  isCampaignStrategyWorkUnit,
} from "./identify-work-unit";
export { validateCampaignStrategyWorkUnitOutput } from "./validate-campaign-strategy-output";
export { mapMarketingStrategyToCampaignStrategyOutput } from "./map-campaign-strategy-output";
export type {
  CampaignStrategyWorkUnitOutput,
  ExecuteMarketingWorkUnitInput,
  ExecuteMarketingWorkUnitResult,
  MarketingPeerRuntimePersistencePort,
  MarketingWorkUnitExecutionFailure,
  MarketingWorkUnitExecutionPhase,
  MarketingWorkUnitExecutionSuccess,
  UnsupportedWorkUnitResult,
} from "./types";
