export type CompanyValue = {
  id: string;
  name: string;
  description?: string;
  priority?: number;
};

export type ToneOfVoice = {
  summary?: string;
  personality?: string[];
  dos?: string[];
  donts?: string[];
  examplePhrases?: string[];
};

export type RiskTolerance = "conservative" | "balanced" | "aggressive";

export type RiskProfile = {
  tolerance?: RiskTolerance;
  summary?: string;
  constraints?: string[];
  escalationRules?: string[];
};

export type DecisionPrinciple = {
  id: string;
  name: string;
  description?: string;
  priority?: number;
};

export type CompanyDna = {
  id: string;
  organizationId: string;
  mission?: string;
  values: CompanyValue[];
  toneOfVoice: ToneOfVoice;
  riskProfile: RiskProfile;
  decisionPrinciples: DecisionPrinciple[];
  createdAt: string;
  updatedAt: string;
};

export type UpdateCompanyDnaInput = {
  mission?: string;
  values?: CompanyValue[];
  toneOfVoice?: ToneOfVoice;
  riskProfile?: RiskProfile;
  decisionPrinciples?: DecisionPrinciple[];
};
