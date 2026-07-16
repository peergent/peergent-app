import type {
  AnalysisProgressCallback,
  AnalysisStepDefinition,
  WebsiteAnalysisInput,
  WebsiteAnalyzer,
} from "./types";
import { buildDemoAssessment } from "./demo-assessment";

export const ANALYSIS_STEPS: AnalysisStepDefinition[] = [
  {
    id: "positioning",
    label: "Understanding company positioning…",
    description: "Reading how the business describes itself and what it sells",
    durationMs: 1400,
  },
  {
    id: "journey",
    label: "Mapping customer journey…",
    description: "Tracing how a visitor might discover, evaluate, and convert",
    durationMs: 1300,
  },
  {
    id: "trust",
    label: "Reviewing trust signals…",
    description: "Looking for credibility markers, proof points, and reassurance",
    durationMs: 1100,
  },
  {
    id: "conversion",
    label: "Analysing conversion opportunities…",
    description: "Identifying where interest might be lost or uncaptured",
    durationMs: 1200,
  },
  {
    id: "operations",
    label: "Looking for operational bottlenecks…",
    description: "Scanning for repetitive workflows that automation could relieve",
    durationMs: 1300,
  },
  {
    id: "workforce",
    label: "Building AI workforce recommendations…",
    description: "Matching AI employees to observed and likely business needs",
    durationMs: 1400,
  },
  {
    id: "briefing",
    label: "Preparing executive briefing…",
    description: "Synthesising findings into a Chief of Staff assessment",
    durationMs: 1200,
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
  ) {
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

    return buildDemoAssessment(url, hostname);
  },
};
