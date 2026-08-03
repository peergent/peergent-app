import type { WebsiteSnapshot, WebsiteFinding, WebsiteIssue, WebsiteOpportunity } from "./types";

/** Builds a deterministic simulated Website Snapshot — no crawl. */
export function buildSimulatedWebsiteSnapshot(input: {
  organizationId: string;
  url: string;
  companyName?: string;
  assembledAt?: string;
}): WebsiteSnapshot {
  const assembledAt = input.assembledAt ?? new Date().toISOString();
  const host = safeHost(input.url);
  const company = input.companyName ?? host;

  const findings: WebsiteFinding[] = [
    {
      id: "finding-hero",
      kind: "strong_hero",
      label: "Strong hero section",
      severity: "positive",
      confidence: "high",
      evidence: [`Homepage at ${input.url} leads with a clear value proposition.`],
      pageId: "page-home",
      recommendation: "Reuse hero messaging in campaign copy.",
    },
    {
      id: "finding-cta",
      kind: "missing_cta",
      label: "Single primary CTA",
      severity: "info",
      confidence: "high",
      evidence: ["Homepage has one primary call-to-action."],
      pageId: "page-home",
    },
    {
      id: "finding-faq",
      kind: "other",
      label: "No FAQ section detected",
      severity: "warning",
      confidence: "medium",
      evidence: ["No dedicated FAQ page or section found in simulated scan."],
      recommendation: "Consider adding FAQ content for campaign landing pages.",
    },
    {
      id: "finding-services",
      kind: "other",
      label: "Services listed",
      severity: "info",
      confidence: "high",
      evidence: ["Three core services referenced on the homepage."],
      pageId: "page-home",
    },
    {
      id: "finding-trust",
      kind: "weak_trust_signals",
      label: "Limited testimonials",
      severity: "warning",
      confidence: "medium",
      evidence: ["No testimonial block detected in simulated scan."],
      recommendation: "Add customer proof before high-intent campaigns.",
    },
    {
      id: "finding-nav",
      kind: "excellent_navigation",
      label: "Clear navigation",
      severity: "positive",
      confidence: "high",
      evidence: ["Primary navigation includes product, pricing, and contact paths."],
    },
  ];

  const issues = findings.filter(
    (f): f is WebsiteIssue => f.severity === "critical" || f.severity === "warning"
  );
  const opportunities = findings.filter(
    (f): f is WebsiteOpportunity => f.severity === "info" || f.severity === "positive"
  );

  return {
    organizationId: input.organizationId,
    source: {
      url: input.url,
      capturedAt: assembledAt,
      method: "demo_simulated",
    },
    state: "demo_simulated",
    metadata: {
      title: company,
      description: `Simulated snapshot for ${company}`,
      language: "en",
      canonicalUrl: input.url,
    },
    pages: [
      {
        id: "page-home",
        path: "/",
        title: company,
        sections: [
          { id: "sec-hero", pageId: "page-home", kind: "hero", heading: company },
          { id: "sec-features", pageId: "page-home", kind: "features", heading: "Features" },
          { id: "sec-cta", pageId: "page-home", kind: "cta", heading: "Get started" },
        ],
      },
    ],
    navigation: {
      primaryLinks: [
        { label: "Product", path: "/product" },
        { label: "Pricing", path: "/pricing" },
        { label: "Contact", path: "/contact" },
      ],
      footerLinks: [{ label: "Privacy", path: "/privacy" }],
    },
    seo: {
      titleTag: `${company} — AI workforce platform`,
      metaDescription: `Simulated SEO metadata for ${company}`,
      h1Count: 1,
      issues: ["Meta description could be more specific to target audience."],
    },
    ctas: [
      {
        id: "cta-primary",
        pageId: "page-home",
        label: "Book a demo",
        href: "/contact",
        prominence: "primary",
      },
    ],
    technology: { detected: ["next.js"], cms: undefined },
    assets: [{ id: "asset-logo", kind: "logo", url: `${input.url}/logo.svg`, alt: `${company} logo` }],
    findings,
    issues,
    opportunities,
    freshness: {
      state: "demo_simulated",
      freshness: "fresh",
      lastUpdatedAt: assembledAt,
    },
    assembledAt,
  };
}

function safeHost(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}
