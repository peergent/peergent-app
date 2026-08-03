import type { WebsiteProvider, WebsiteProviderScanInput } from "./website-provider";
import type { WebsiteSnapshot, WebsiteFinding, WebsiteIssue, WebsiteOpportunity } from "../types";

function page(id: string, path: string, title: string, sections: WebsiteSnapshot["pages"][number]["sections"]) {
  return { id, path, title, sections };
}

/**
 * Deterministic multi-page demo website snapshot.
 * Homepage, About, Services, Contact — no AI, no fetch.
 */
export function buildDemoWebsiteSnapshotSync(input: WebsiteProviderScanInput): WebsiteSnapshot {
  const assembledAt = new Date().toISOString();
  const company = input.companyName ?? "Company";
  const base = input.url.replace(/\/$/, "");

    const pages = [
      page("page-home", "/", company, [
        { id: "home-hero", pageId: "page-home", kind: "hero", heading: company },
        { id: "home-cta", pageId: "page-home", kind: "cta", heading: "Get started" },
      ]),
      page("page-about", "/about", `About ${company}`, [
        { id: "about-story", pageId: "page-about", kind: "other", heading: "Our story" },
      ]),
      page("page-services", "/services", "Services", [
        { id: "svc-1", pageId: "page-services", kind: "features", heading: "Core services" },
      ]),
      page("page-contact", "/contact", "Contact", [
        { id: "contact-form", pageId: "page-contact", kind: "cta", heading: "Contact us" },
      ]),
    ];

    const findings: WebsiteFinding[] = [
      {
        id: "demo-strong-hero",
        kind: "strong_hero" as const,
        label: "Strong hero section",
        severity: "positive" as const,
        confidence: "high" as const,
        evidence: [`Homepage at ${base} leads with a clear value proposition.`],
        pageId: "page-home",
      },
      {
        id: "demo-single-cta",
        kind: "missing_cta" as const,
        label: "Single primary CTA",
        severity: "info" as const,
        confidence: "high" as const,
        evidence: ["Homepage has one primary call-to-action."],
        pageId: "page-home",
      },
      {
        id: "demo-no-faq",
        kind: "other" as const,
        label: "No FAQ section",
        severity: "warning" as const,
        confidence: "medium" as const,
        evidence: ["No FAQ page detected in demo scan."],
        recommendation: "Consider adding FAQ content.",
      },
      {
        id: "demo-nav",
        kind: "excellent_navigation" as const,
        label: "Clear navigation",
        severity: "positive" as const,
        confidence: "high" as const,
        evidence: ["Navigation includes Home, About, Services, Contact."],
      },
    ];

    return {
      organizationId: input.organizationId,
      source: { url: input.url, capturedAt: assembledAt, method: "demo_simulated" },
      state: "demo_simulated",
      metadata: {
        title: company,
        description: `Demo snapshot for ${company}`,
        language: "en",
        canonicalUrl: base,
      },
      pages,
      navigation: {
        primaryLinks: [
          { label: "Home", path: "/" },
          { label: "About", path: "/about" },
          { label: "Services", path: "/services" },
          { label: "Contact", path: "/contact" },
        ],
        footerLinks: [{ label: "Privacy", path: "/privacy" }],
      },
      seo: {
        titleTag: `${company} — official site`,
        metaDescription: `Demo SEO for ${company}`,
        h1Count: pages.length,
        issues: ["Meta description could be more specific."],
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
      assets: [
        { id: "logo", kind: "logo", url: `${base}/logo.svg`, alt: `${company} logo` },
        { id: "hero-img", kind: "image", url: `${base}/hero.jpg`, alt: "Hero" },
      ],
      findings,
      issues: findings.filter(
        (f): f is WebsiteIssue => f.severity === "warning" || f.severity === "critical"
      ),
      opportunities: findings.filter(
        (f): f is WebsiteOpportunity => f.severity === "info" || f.severity === "positive"
      ),
      freshness: { state: "demo_simulated", freshness: "fresh", lastUpdatedAt: assembledAt },
      assembledAt,
    };
}

export class DemoWebsiteProvider implements WebsiteProvider {
  readonly id = "demo";

  async scan(input: WebsiteProviderScanInput): Promise<WebsiteSnapshot> {
    return buildDemoWebsiteSnapshotSync(input);
  }
}

export function createDemoWebsiteProvider(): DemoWebsiteProvider {
  return new DemoWebsiteProvider();
}
