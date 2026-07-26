import type { MarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";

export type EmailCampaignWorkUnitOutput = {
  readonly subject: string;
  readonly previewText: string;
  readonly body: string;
  readonly cta: string;
  readonly secondaryCta?: string;
  readonly suggestedSendTiming?: string;
  readonly audienceNote?: string;
};

export function mapEmailCampaignToWorkUnitOutput(
  email: MarketingEmailCampaign
): EmailCampaignWorkUnitOutput {
  return {
    subject: email.subject,
    previewText: email.previewText,
    body: email.body,
    cta: email.cta,
    ...(email.secondaryCta ? { secondaryCta: email.secondaryCta } : {}),
    ...(email.suggestedSendTiming ? { suggestedSendTiming: email.suggestedSendTiming } : {}),
    ...(email.audienceNote ? { audienceNote: email.audienceNote } : {}),
  };
}

export function validateEmailCampaignWorkUnitOutput(email: MarketingEmailCampaign): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!email.subject?.trim()) {
    errors.push("Subject is required.");
  }
  if (!email.previewText?.trim()) {
    errors.push("Preview text is required.");
  }
  if (!email.body?.trim() || email.body.trim().length < 40) {
    errors.push("Message body is required.");
  }
  if (!email.cta?.trim()) {
    errors.push("Call to action is required.");
  }
  return { valid: errors.length === 0, errors };
}
