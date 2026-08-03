export type WebsiteState =
  | "no_website"
  | "waiting"
  | "queued"
  | "scanning"
  | "scanned"
  | "failed"
  | "needs_refresh"
  | "customer_corrected"
  | "demo_simulated";

export const WEBSITE_STATES: readonly WebsiteState[] = [
  "no_website",
  "waiting",
  "queued",
  "scanning",
  "scanned",
  "failed",
  "needs_refresh",
  "customer_corrected",
  "demo_simulated",
];
