export type DataLabel =
  | "demo-insight"
  | "provisional"
  | "more-data-required"
  | "demo-activity"
  | "demo-data";

export type QualitativeHealthState =
  | "baseline-in-progress"
  | "preliminary"
  | "more-data-required";

export type DomainHealthState =
  | "strong-signal"
  | "developing"
  | "needs-data"
  | "not-assessed";

export type ConfidenceLevel = "low" | "medium" | "high";

export type ExecutiveBrief = {
  /** @deprecated Use conclusion — kept for compatibility during migration */
  summary?: string;
  conclusion: string;
  rationale: string;
  primaryAction: {
    label: string;
    href?: string;
    disabled?: boolean;
    disabledReason?: string;
  };
};

export type BusinessDomain = {
  id: string;
  name: string;
  state: DomainHealthState;
  note: string;
};

export type Opportunity = {
  id: string;
  rank: number;
  title: string;
  impactType: string;
  estimate: string;
  confidence: ConfidenceLevel;
  signals: string[];
  missingData: string[];
  action: {
    label: string;
    href?: string;
    disabled?: boolean;
  };
};

export type RecommendedAction = {
  id: string;
  label: string;
  description: string;
  href?: string;
  disabled?: boolean;
  disabledReason?: string;
};

export type CoverageItem = {
  id: string;
  name: string;
  status: "connected" | "partial" | "not-connected" | "not-started";
  detail: string;
  href?: string;
};

export type DataCompletenessBreakdown = {
  totalPercent: number;
  items: {
    id: string;
    label: string;
    weight: number;
    earned: number;
    met: boolean;
    detail: string;
  }[];
  explanation: string;
};

export type ActivityEntry = {
  id: string;
  time: string;
  title: string;
  description: string;
};

export type GreetingData = {
  salutation: string;
  name: string;
  subtitle: string;
  workspaceName: string;
  formattedDate: string;
};
