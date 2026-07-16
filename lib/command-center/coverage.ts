import type { CoverageItem, DataCompletenessBreakdown } from "./types";

type CoverageInput = {
  peerCount: number;
  hasWebsiteOnFile: boolean;
};

const SOURCE_WEIGHT = 20;

export function buildIntelligenceCoverage(
  input: CoverageInput
): CoverageItem[] {
  const websiteStatus = input.hasWebsiteOnFile ? "partial" : "not-started";
  const knowledgeStatus = input.hasWebsiteOnFile ? "partial" : "not-started";

  return [
    {
      id: "website-intelligence",
      name: "Website Intelligence",
      status: websiteStatus,
      detail: input.hasWebsiteOnFile
        ? "Company website on file — run a full scan for deeper signals"
        : "No website analyzed yet",
      href: "/website-intelligence",
    },
    {
      id: "knowledge",
      name: "Knowledge",
      status: knowledgeStatus,
      detail: input.hasWebsiteOnFile
        ? "Partial context from linked websites"
        : "No knowledge sources connected",
      href: "/knowledge",
    },
    {
      id: "google-analytics",
      name: "Google Analytics",
      status: "not-connected",
      detail: "Not connected",
    },
    {
      id: "operations-scan",
      name: "Operations Scan",
      status: "not-connected",
      detail: "Not completed",
    },
    {
      id: "crm",
      name: "CRM",
      status: "not-connected",
      detail: "Not connected",
    },
  ];
}

export function buildDataCompleteness(
  input: CoverageInput
): DataCompletenessBreakdown {
  const items = [
    {
      id: "peers",
      label: "AI workforce deployed",
      weight: SOURCE_WEIGHT,
      earned: input.peerCount > 0 ? SOURCE_WEIGHT : 0,
      met: input.peerCount > 0,
      detail:
        input.peerCount > 0
          ? `${input.peerCount} peer(s) configured in Supabase`
          : "No AI peers deployed yet",
    },
    {
      id: "website",
      label: "Company website on file",
      weight: SOURCE_WEIGHT,
      earned: input.hasWebsiteOnFile ? SOURCE_WEIGHT : 0,
      met: input.hasWebsiteOnFile,
      detail: input.hasWebsiteOnFile
        ? "At least one peer has a linked company website"
        : "No company website stored yet",
    },
    {
      id: "knowledge-uploads",
      label: "Knowledge documents uploaded",
      weight: SOURCE_WEIGHT,
      earned: 0,
      met: false,
      detail: "No uploaded documents stored in the database yet",
    },
    {
      id: "analytics",
      label: "Google Analytics connected",
      weight: SOURCE_WEIGHT,
      earned: 0,
      met: false,
      detail: "Integration not connected",
    },
    {
      id: "crm",
      label: "CRM connected",
      weight: SOURCE_WEIGHT,
      earned: 0,
      met: false,
      detail: "Integration not connected",
    },
  ];

  const totalPercent = items.reduce((sum, item) => sum + item.earned, 0);

  return {
    totalPercent,
    items,
    explanation:
      "Each source contributes 20%. Points are earned only from verified statuses in Supabase or confirmed integrations — demo content does not count.",
  };
}
