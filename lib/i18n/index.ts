export type { HomeCopy, HomeLocale, HomeUiCopy } from "./home-copy";
export { getHomeCopy, resolveHomeLocale } from "./home-copy";
export type { MarketingCampaignCopy, MarketingCampaignLocale } from "./marketing-campaign-copy";
export {
  formatMarketingRelativeTime,
  getMarketingCampaignCopy,
  resolveMarketingCampaignLocale,
} from "./marketing-campaign-copy";
export {
  customerLocalePreferenceFromEnv,
  PEERGENT_PUBLIC_LOCALE_ENV,
  readPeergentPublicLocaleEnv,
  resolveCustomerLocalePreference,
} from "./resolve-customer-locale-preference";
export { formatHomeRelativeTime } from "./format-relative-time";
export type { InboxCopy } from "./inbox-copy";
export { getInboxCopy } from "./inbox-copy";
