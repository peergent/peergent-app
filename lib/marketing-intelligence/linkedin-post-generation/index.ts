export type { MarketingLinkedInPost, ParsedMarketingLinkedInPost } from "./types";
export {
  buildMarketingLinkedInPostTaskAppendix,
  MARKETING_LINKEDIN_POST_BEHAVIORAL_INSTRUCTIONS,
  MARKETING_LINKEDIN_POST_DEFAULT_MAX_TOKENS,
} from "./build-linkedin-post-task-prompt";
export { parseMarketingLinkedInPostResponse } from "./parse-marketing-linkedin-post-response";
export {
  generateMarketingLinkedInPost,
  type GenerateMarketingLinkedInPostInput,
  type GenerateMarketingLinkedInPostResult,
} from "./generate-marketing-linkedin-post";
