import type { ContextAssemblyState } from "./assembly-types";
import type { CompanyProfile } from "../company/profile";
import type { WebsiteSnapshot } from "../website/types";

export type ReadinessDimension =
  | "company_profile"
  | "website"
  | "brand"
  | "business"
  | "corrections";

export type ReadinessScore = {
  dimension: ReadinessDimension;
  score: number;
  label: string;
};

export type ContextReadinessReport = {
  scores: readonly ReadinessScore[];
  overall: ContextAssemblyState;
  overallScore: number;
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreField(value: string | null | undefined, confirmed: boolean): number {
  if (!value?.trim()) return 0;
  return confirmed ? 100 : 60;
}

function scoreList(values: readonly string[] | null | undefined, confirmed: boolean): number {
  if (!values?.length) return 0;
  return confirmed ? 100 : 60;
}

export function scoreCompanyProfile(profile: CompanyProfile): ReadinessScore {
  const fields = [
    scoreField(profile.companyName.value, profile.companyName.customerConfirmed),
    scoreField(profile.industry.value, profile.industry.customerConfirmed),
    scoreField(profile.positioning.value, profile.positioning.customerConfirmed),
    scoreList(profile.targetAudiences.value, profile.targetAudiences.customerConfirmed),
    scoreList(profile.products.value, profile.products.customerConfirmed),
  ];
  const score = clampScore(fields.reduce((a, b) => a + b, 0) / fields.length);
  return { dimension: "company_profile", score, label: "Company profile" };
}

export function scoreWebsite(website: WebsiteSnapshot | null): ReadinessScore {
  if (!website) return { dimension: "website", score: 0, label: "Website" };
  const hasPages = website.pages.length > 0;
  const hasFindings = website.findings.length > 0;
  const score = clampScore((hasPages ? 50 : 0) + (hasFindings ? 50 : 0));
  return { dimension: "website", score, label: "Website" };
}

export function scoreBrand(profile: CompanyProfile, brandAvailable: boolean): ReadinessScore {
  if (!brandAvailable) return { dimension: "brand", score: 0, label: "Brand" };
  const fields = [
    scoreField(profile.tone.value, profile.tone.customerConfirmed),
    scoreField(profile.positioning.value, profile.positioning.customerConfirmed),
    scoreList(profile.brandPromises.value, profile.brandPromises.customerConfirmed),
  ];
  const score = clampScore(fields.reduce((a, b) => a + b, 0) / fields.length);
  return { dimension: "brand", score, label: "Brand" };
}

export function scoreBusiness(profile: CompanyProfile, businessAvailable: boolean): ReadinessScore {
  if (!businessAvailable) return { dimension: "business", score: 0, label: "Business" };
  const fields = [
    scoreList(profile.products.value, profile.products.customerConfirmed),
    scoreList(profile.services.value, profile.services.customerConfirmed),
    scoreList(profile.mainCompetitors.value, profile.mainCompetitors.customerConfirmed),
  ];
  const score = clampScore(fields.reduce((a, b) => a + b, 0) / fields.length);
  return { dimension: "business", score, label: "Business" };
}

export function scoreCorrections(appliedCount: number): ReadinessScore {
  const score = appliedCount > 0 ? 100 : 0;
  return { dimension: "corrections", score, label: "Corrections" };
}

export function buildReadinessReport(input: {
  profile: CompanyProfile;
  website: WebsiteSnapshot | null;
  brandAvailable: boolean;
  businessAvailable: boolean;
  correctionsApplied: number;
}): ContextReadinessReport {
  const scores = [
    scoreCompanyProfile(input.profile),
    scoreWebsite(input.website),
    scoreBrand(input.profile, input.brandAvailable),
    scoreBusiness(input.profile, input.businessAvailable),
    scoreCorrections(input.correctionsApplied),
  ];
  const overallScore = clampScore(
    scores.reduce((sum, s) => sum + s.score, 0) / scores.length
  );
  let overall: ContextAssemblyState = "unknown";
  if (overallScore >= 70) overall = "ready";
  else if (overallScore >= 35) overall = "partial";
  else if (overallScore > 0) overall = "needs_information";
  return { scores, overall, overallScore };
}

export function readinessNeedsMoreInfo(report: ContextReadinessReport): boolean {
  return report.overall === "needs_information" || report.overall === "unknown";
}
