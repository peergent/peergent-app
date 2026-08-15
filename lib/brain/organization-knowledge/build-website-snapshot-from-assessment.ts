import type { WebsiteIntelligenceAssessment } from "@/lib/website-intelligence/types";
import { resolveFreshness } from "../domain/freshness";
import type { WebsiteFinding, WebsiteSnapshot } from "../website/types";

const WEBSITE_INTELLIGENCE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function mapAssessmentFindings(assessment: WebsiteIntelligenceAssessment): WebsiteFinding[] {
  const findings: WebsiteFinding[] = [];
  let index = 0;

  const push = (
    kind: WebsiteFinding["kind"],
    label: string,
    statement: string,
    severity: WebsiteFinding["severity"]
  ) => {
    const text = statement.trim();
    if (!text) return;
    findings.push({
      id: `wi-finding-${++index}`,
      kind,
      label,
      severity,
      confidence: severity === "positive" ? "high" : "medium",
      evidence: [text],
    });
  };

  if (assessment.executiveSummary?.conclusion?.trim()) {
    push("other", "Executive summary", assessment.executiveSummary.conclusion, "info");
  }

  for (const finding of assessment.companyDna?.findings ?? []) {
    push("other", "Company DNA", finding.statement, "info");
  }

  for (const finding of assessment.marketingGrowth?.observed ?? []) {
    push("other", "Marketing observation", finding.statement, "positive");
  }

  for (const finding of assessment.marketingGrowth?.likely ?? []) {
    push("other", "Marketing signal", finding.statement, "info");
  }

  for (const finding of assessment.customerJourney?.frictionPoints ?? []) {
    push("weak_trust_signals", "Customer journey friction", finding.statement, "warning");
  }

  for (const finding of assessment.customerJourney?.opportunities ?? []) {
    push("other", "Customer journey opportunity", finding.statement, "positive");
  }

  return findings;
}

/** Converts a stored Website Intelligence assessment into a canonical WebsiteSnapshot. */
export function buildWebsiteSnapshotFromAssessment(input: {
  organizationId: string;
  assessment: WebsiteIntelligenceAssessment;
  analyzedAt: string;
  sourceUrl: string;
}): WebsiteSnapshot {
  const url = (input.assessment.meta.url || input.sourceUrl).trim().replace(/\/$/, "");
  const assembledAt = new Date().toISOString();
  const freshnessState = resolveFreshness(input.analyzedAt, WEBSITE_INTELLIGENCE_TTL_MS);
  const state =
    freshnessState === "expired" || freshnessState === "invalid"
      ? ("needs_refresh" as const)
      : ("scanned" as const);

  const findings = mapAssessmentFindings(input.assessment);
  const issues = findings.filter(
    (f): f is import("../website/types").WebsiteIssue =>
      f.severity === "critical" || f.severity === "warning"
  );
  const opportunities = findings.filter(
    (f): f is import("../website/types").WebsiteOpportunity =>
      f.severity === "info" || f.severity === "positive"
  );

  return {
    organizationId: input.organizationId,
    source: {
      url,
      capturedAt: input.analyzedAt,
      method: "integration",
    },
    state,
    metadata: {
      title: input.assessment.meta.companyName?.trim() || undefined,
      description: input.assessment.executiveSummary?.conclusion?.trim() || undefined,
      canonicalUrl: url,
    },
    pages: [],
    navigation: { primaryLinks: [], footerLinks: [] },
    seo: { h1Count: 0, issues: [] },
    ctas: [],
    technology: { detected: [] },
    assets: [],
    findings,
    issues,
    opportunities,
    freshness: {
      freshness: freshnessState,
      lastUpdatedAt: input.analyzedAt,
      state,
    },
    assembledAt,
  };
}
