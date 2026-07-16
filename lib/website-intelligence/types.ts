export type WebsiteAnalysisInput = {
  url: string;
};

export type AnalysisStepDefinition = {
  id: string;
  label: string;
  description: string;
  durationMs: number;
};

export type WebsiteInsight = {
  title: string;
  description: string;
  icon: "traffic" | "support" | "content" | "sales";
};

export type AutomationOpportunity = {
  area: string;
  score: number;
  detail: string;
};

export type RecommendedEmployee = {
  employeeType: string;
  role: string;
  name: string;
  priority: "high" | "medium" | "optional";
  rationale: string;
  estimatedImpact: string;
  suggestedObjective: string;
  gradient: string;
};

export type WebsiteIntelligenceReport = {
  url: string;
  companyName: string;
  industry: string;
  summary: string;
  insights: WebsiteInsight[];
  opportunities: AutomationOpportunity[];
  recommendations: RecommendedEmployee[];
  analyzedAt: string;
};

export type AnalysisProgressCallback = (
  stepId: string,
  stepIndex: number
) => void;

export interface WebsiteAnalyzer {
  readonly steps: AnalysisStepDefinition[];
  analyze(
    input: WebsiteAnalysisInput,
    onProgress: AnalysisProgressCallback
  ): Promise<WebsiteIntelligenceReport>;
}
