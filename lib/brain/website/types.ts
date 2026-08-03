import type { BrainConfidence } from "../domain/confidence";
import type { FreshnessMetadata } from "../domain/freshness";
import type { WebsiteState } from "./states";

export type WebsiteSource = {
  url: string;
  capturedAt: string;
  method: "customer_supplied" | "integration" | "demo_simulated" | "unknown";
};

export type WebsiteMetadata = {
  title?: string;
  description?: string;
  language?: string;
  canonicalUrl?: string;
};

export type WebsiteSection = {
  id: string;
  pageId: string;
  kind: "hero" | "features" | "pricing" | "faq" | "testimonials" | "cta" | "footer" | "other";
  heading?: string;
  summary?: string;
};

export type WebsitePage = {
  id: string;
  path: string;
  title?: string;
  sections: readonly WebsiteSection[];
};

export type WebsiteNavigation = {
  primaryLinks: readonly { label: string; path: string }[];
  footerLinks: readonly { label: string; path: string }[];
};

export type WebsiteSEO = {
  titleTag?: string;
  metaDescription?: string;
  h1Count: number;
  issues: readonly string[];
};

export type WebsiteCTA = {
  id: string;
  pageId: string;
  label: string;
  href?: string;
  prominence: "primary" | "secondary" | "missing";
};

export type WebsiteTechnology = {
  detected: readonly string[];
  cms?: string;
};

export type WebsiteAsset = {
  id: string;
  kind: "image" | "video" | "document" | "logo";
  url?: string;
  alt?: string;
};

export type WebsiteFindingSeverity = "critical" | "warning" | "info" | "positive";

export type WebsiteFinding = {
  id: string;
  kind:
    | "missing_cta"
    | "weak_positioning"
    | "seo_issue"
    | "slow_loading"
    | "no_testimonials"
    | "no_pricing"
    | "strong_hero"
    | "excellent_navigation"
    | "weak_trust_signals"
    | "other";
  label: string;
  severity: WebsiteFindingSeverity;
  confidence: BrainConfidence;
  evidence: readonly string[];
  pageId?: string;
  recommendation?: string;
};

export type WebsiteIssue = WebsiteFinding & { severity: "critical" | "warning" };

export type WebsiteOpportunity = WebsiteFinding & {
  severity: "info" | "positive";
};

export type WebsiteFreshness = FreshnessMetadata & {
  state: WebsiteState;
};

/** Organization-level website intelligence — campaigns reference, not own. */
export type WebsiteSnapshot = {
  organizationId: string;
  source: WebsiteSource;
  state: WebsiteState;
  metadata: WebsiteMetadata;
  pages: readonly WebsitePage[];
  navigation: WebsiteNavigation;
  seo: WebsiteSEO;
  ctas: readonly WebsiteCTA[];
  technology: WebsiteTechnology;
  assets: readonly WebsiteAsset[];
  findings: readonly WebsiteFinding[];
  issues: readonly WebsiteIssue[];
  opportunities: readonly WebsiteOpportunity[];
  freshness: WebsiteFreshness;
  assembledAt: string;
};
