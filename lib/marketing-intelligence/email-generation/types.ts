/** Review-ready marketing email artifact for one work unit. */
export type MarketingEmailCampaign = {
  readonly id: string;
  readonly workUnitId: string;
  readonly campaignId: string;
  readonly subject: string;
  readonly previewText: string;
  readonly body: string;
  readonly cta: string;
  readonly secondaryCta?: string;
  readonly suggestedSendTiming?: string;
  readonly audienceNote?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ParsedMarketingEmailCampaign = {
  readonly subject: string;
  readonly previewText: string;
  readonly body: string;
  readonly cta: string;
  readonly secondaryCta?: string;
  readonly suggestedSendTiming?: string;
  readonly audienceNote?: string;
};
