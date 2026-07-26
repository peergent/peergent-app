import type { MarketingEmailCampaign, ParsedMarketingEmailCampaign } from "./types";

export function mapParsedEmailToMarketingEmailCampaign(input: {
  parsed: ParsedMarketingEmailCampaign;
  workUnitId: string;
  campaignId: string;
  assembledAt: string;
}): MarketingEmailCampaign {
  return {
    id: `email-campaign:${input.workUnitId}`,
    workUnitId: input.workUnitId,
    campaignId: input.campaignId,
    subject: input.parsed.subject,
    previewText: input.parsed.previewText,
    body: input.parsed.body,
    cta: input.parsed.cta,
    ...(input.parsed.secondaryCta ? { secondaryCta: input.parsed.secondaryCta } : {}),
    ...(input.parsed.suggestedSendTiming
      ? { suggestedSendTiming: input.parsed.suggestedSendTiming }
      : {}),
    ...(input.parsed.audienceNote ? { audienceNote: input.parsed.audienceNote } : {}),
    createdAt: input.assembledAt,
    updatedAt: input.assembledAt,
  };
}
