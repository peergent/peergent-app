export type IntegrationProviderId =
  | "instagram"
  | "linkedin"
  | "meta"
  | "google_ads"
  | "ga4"
  | "search_console"
  | "mailchimp"
  | "wordpress"
  | "hubspot";

export type IntegrationConnectionStatus =
  | "connected"
  | "needs_reconnect"
  | "not_connected";

export type IntegrationConnection = {
  id: IntegrationProviderId;
  label: string;
  status: IntegrationConnectionStatus;
  settingsHref: string;
  lastSyncedAt: string | null;
};

export const INTEGRATION_PROVIDERS: IntegrationProviderId[] = [
  "instagram",
  "linkedin",
  "meta",
  "google_ads",
  "ga4",
  "search_console",
  "mailchimp",
  "wordpress",
  "hubspot",
];

export const INTEGRATION_LABELS: Record<IntegrationProviderId, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  meta: "Meta",
  google_ads: "Google Ads",
  ga4: "GA4",
  search_console: "Search Console",
  mailchimp: "Mailchimp",
  wordpress: "WordPress",
  hubspot: "HubSpot",
};

export function isChannelConnectedForPublishing(
  connections: IntegrationConnection[],
  channel: string
): boolean {
  const normalized = channel.toLowerCase();
  const provider: IntegrationProviderId | null = normalized.includes("instagram")
    ? "instagram"
    : normalized.includes("linkedin")
      ? "linkedin"
      : normalized.includes("meta") || normalized.includes("facebook")
        ? "meta"
        : normalized.includes("google")
          ? "google_ads"
          : normalized.includes("mail") || normalized.includes("newsletter")
            ? "mailchimp"
            : normalized.includes("wordpress") || normalized.includes("website")
              ? "wordpress"
              : null;

  if (!provider) return false;
  return connections.find((c) => c.id === provider)?.status === "connected";
}
