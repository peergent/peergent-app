export type MarketingIntelligenceModuleSpec = {
  id: string;
  title: string;
  purpose: string;
};

export type MarketingIntelligenceModule = MarketingIntelligenceModuleSpec & {
  readonly layerVersion: string;
};
