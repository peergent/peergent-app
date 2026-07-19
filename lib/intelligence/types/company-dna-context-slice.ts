import type {
  CompanyValue,
  DecisionPrinciple,
  RiskProfile,
  ToneOfVoice,
} from "@/lib/company-dna";

/** Engine-facing projection of Company DNA — no DB metadata. */
export type CompanyDnaContextSlice = {
  available: boolean;
  mission?: string;
  values: CompanyValue[];
  toneOfVoice: ToneOfVoice;
  riskProfile: RiskProfile;
  decisionPrinciples: DecisionPrinciple[];
};

export function emptyCompanyDnaContextSlice(): CompanyDnaContextSlice {
  return {
    available: false,
    values: [],
    toneOfVoice: {},
    riskProfile: {},
    decisionPrinciples: [],
  };
}

export function companyDnaToContextSlice(
  dna: import("@/lib/company-dna").CompanyDna
): CompanyDnaContextSlice {
  const hasContent =
    Boolean(dna.mission?.trim()) ||
    dna.values.length > 0 ||
    Boolean(dna.toneOfVoice.summary?.trim()) ||
    dna.decisionPrinciples.length > 0;

  return {
    available: hasContent,
    mission: dna.mission,
    values: dna.values,
    toneOfVoice: dna.toneOfVoice,
    riskProfile: dna.riskProfile,
    decisionPrinciples: dna.decisionPrinciples,
  };
}
