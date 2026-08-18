/**
 * PX-61 — re-exports unified context resolution bridge (backward compatibility).
 */

export {
  submitLiveCampaignCompanyContextServer,
  submitCampaignContextResolutionServer,
  resetContextBridgeInFlightForTests,
  type SubmitLiveCampaignCompanyContextServerInput,
  type SubmitLiveCampaignCompanyContextServerResult,
  type SubmitCampaignContextResolutionServerInput,
  type CampaignContextResolutionKind,
} from "./campaign-context-resolution-bridge-server";

export type { SubmitCampaignContextResolutionServerResult } from "./campaign-context-resolution-types";
