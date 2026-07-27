import {
  resolveMarketingCampaignLocale,
  type MarketingCampaignLocale,
} from "./marketing-campaign-copy";

/** Public env key for local acceptance testing (customer Marketing Peer UI only). */
export const PEERGENT_PUBLIC_LOCALE_ENV = "NEXT_PUBLIC_PEERGENT_LOCALE";

/**
 * Raw value from `NEXT_PUBLIC_PEERGENT_LOCALE` (trimmed, lowercased), or null if unset/empty.
 */
export function readPeergentPublicLocaleEnv(): string | null {
  const raw = process.env[PEERGENT_PUBLIC_LOCALE_ENV];
  if (raw == null) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed === "" ? null : trimmed;
}

/**
 * Value to pass as `localePreference` on customer campaign/review experiences.
 * Explicit preference wins; otherwise uses the public env var.
 */
export function customerLocalePreferenceFromEnv(
  explicitPreference?: string | null
): string | undefined {
  const value = explicitPreference ?? readPeergentPublicLocaleEnv();
  return value ?? undefined;
}

/**
 * Resolved locale for customer surfaces (`en` | `nl`), with English fallback.
 */
export function resolveCustomerLocalePreference(
  explicitPreference?: string | null
): MarketingCampaignLocale {
  return resolveMarketingCampaignLocale(
    explicitPreference ?? readPeergentPublicLocaleEnv()
  );
}
