import type { RecommendedEmployee } from "./types";

const EMPLOYEE_TYPE_TO_ROLE: Record<string, string> = {
  "Sales Employee": "Sales",
  "Customer Success Employee": "Support",
  "Marketing Employee": "Marketing",
  Planner: "Planning",
  "Finance Employee": "Finance",
};

export function mapEmployeeTypeToPeerRole(employeeType: string): string {
  return EMPLOYEE_TYPE_TO_ROLE[employeeType] ?? "Custom";
}

export type PeerInsertFromRecommendation = {
  name: string;
  role: string;
  website: string;
  objective: string;
  status: "active";
};

export function buildPeerInsertFromRecommendation(
  recommendation: RecommendedEmployee,
  websiteUrl: string
): PeerInsertFromRecommendation {
  return {
    name: recommendation.name.trim(),
    role: mapEmployeeTypeToPeerRole(recommendation.employeeType),
    website: websiteUrl.trim(),
    objective: recommendation.suggestedObjective.trim(),
    status: "active",
  };
}
