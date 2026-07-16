import type {
  AnalysisProgressCallback,
  AnalysisStepDefinition,
  WebsiteAnalysisInput,
  WebsiteAnalyzer,
  WebsiteIntelligenceReport,
} from "./types";
import { buildDemoReport } from "./demo-report";

export const ANALYSIS_STEPS: AnalysisStepDefinition[] = [
  {
    id: "crawl",
    label: "Crawling website structure",
    description: "Mapping pages, navigation, and key content zones",
    durationMs: 1200,
  },
  {
    id: "business-model",
    label: "Identifying business model",
    description: "Detecting industry, offerings, and target audience",
    durationMs: 1400,
  },
  {
    id: "touchpoints",
    label: "Mapping customer touchpoints",
    description: "Finding where visitors convert, ask questions, or drop off",
    durationMs: 1100,
  },
  {
    id: "opportunities",
    label: "Detecting automation opportunities",
    description: "Scoring workflows that benefit from AI employees",
    durationMs: 1300,
  },
  {
    id: "recommendations",
    label: "Generating AI workforce plan",
    description: "Matching digital employees to your business needs",
    durationMs: 1500,
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function extractHostname(url: string) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url.trim().replace(/^https?:\/\//i, "").replace(/^www\./, "").split("/")[0];
  }
}

export const demoWebsiteAnalyzer: WebsiteAnalyzer = {
  steps: ANALYSIS_STEPS,

  async analyze(
    input: WebsiteAnalysisInput,
    onProgress: AnalysisProgressCallback
  ): Promise<WebsiteIntelligenceReport> {
    const url = normalizeUrl(input.url);

    if (!url) {
      throw new Error("Please enter a valid company website.");
    }

    const hostname = extractHostname(url);

    if (!hostname || !hostname.includes(".")) {
      throw new Error("Please enter a valid company website URL.");
    }

    for (let index = 0; index < ANALYSIS_STEPS.length; index += 1) {
      const step = ANALYSIS_STEPS[index];
      await sleep(step.durationMs);
      onProgress(step.id, index);
    }

    return buildDemoReport(url, hostname);
  },
};
