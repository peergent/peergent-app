export type { MarketingEmailCampaign, ParsedMarketingEmailCampaign } from "./types";
export {
  buildMarketingEmailCampaignTaskAppendix,
  MARKETING_EMAIL_CAMPAIGN_BEHAVIORAL_INSTRUCTIONS,
  MARKETING_EMAIL_CAMPAIGN_DEFAULT_MAX_TOKENS,
} from "./build-email-task-prompt";
export { parseMarketingEmailCampaignResponse } from "./parse-marketing-email-response";
export {
  generateMarketingEmailCampaign,
  type GenerateMarketingEmailCampaignInput,
  type GenerateMarketingEmailCampaignResult,
} from "./generate-marketing-email";
