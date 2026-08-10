/** Validation Brain domain registry — evaluation modules, not rewrite modules. */

import type { ValidationDomainId } from "../types";

export type ValidationModuleSpec = {
  id: ValidationDomainId;
  title: string;
  purpose: string;
  weight: number;
};

export const VALIDATION_MODULE_SPECS: readonly ValidationModuleSpec[] = [
  {
    id: "business_fit",
    title: "Business Fit",
    purpose: "Does this campaign solve the business objective?",
    weight: 1.2,
  },
  {
    id: "brand_consistency",
    title: "Brand Consistency",
    purpose: "Does messaging match brand identity?",
    weight: 1.1,
  },
  {
    id: "tone_of_voice",
    title: "Tone of Voice",
    purpose: "Does communication match desired tone?",
    weight: 1.0,
  },
  {
    id: "audience_fit",
    title: "Audience Fit",
    purpose: "Will the intended audience understand and respond?",
    weight: 1.1,
  },
  {
    id: "positioning",
    title: "Positioning",
    purpose: "Does this strengthen the chosen market position?",
    weight: 1.0,
  },
  {
    id: "competitive_differentiation",
    title: "Competitive Differentiation",
    purpose: "Does this avoid sounding like competitors?",
    weight: 1.0,
  },
  {
    id: "creative_quality",
    title: "Creative Quality",
    purpose: "Is the concept original enough to publish?",
    weight: 0.9,
  },
  {
    id: "message_clarity",
    title: "Message Clarity",
    purpose: "Can someone understand the message within seconds?",
    weight: 1.1,
  },
  {
    id: "trust",
    title: "Trust",
    purpose: "Are sufficient trust builders included?",
    weight: 0.9,
  },
  {
    id: "objections",
    title: "Objections",
    purpose: "Are customer objections addressed?",
    weight: 0.8,
  },
  {
    id: "channel_linkedin",
    title: "LinkedIn Quality",
    purpose: "Is LinkedIn content appropriate for the channel?",
    weight: 0.7,
  },
  {
    id: "channel_google_ads",
    title: "Google Ads Quality",
    purpose: "Are ad specs appropriate for paid search/display?",
    weight: 0.7,
  },
  {
    id: "channel_email",
    title: "Email Quality",
    purpose: "Is email content appropriate for the channel?",
    weight: 0.7,
  },
  {
    id: "channel_landing_page",
    title: "Landing Page Quality",
    purpose: "Is landing page content conversion-ready?",
    weight: 0.8,
  },
  {
    id: "channel_blog",
    title: "Blog Quality",
    purpose: "Is blog content appropriate for editorial depth?",
    weight: 0.6,
  },
  {
    id: "cta_quality",
    title: "CTA Quality",
    purpose: "Is there one clear next action?",
    weight: 1.0,
  },
  {
    id: "conversion_potential",
    title: "Conversion Potential",
    purpose: "How likely is this to convert?",
    weight: 1.0,
  },
  {
    id: "consistency",
    title: "Consistency",
    purpose: "Do all deliverables tell the same story?",
    weight: 1.0,
  },
  {
    id: "legal_claims",
    title: "Legal & Claims",
    purpose: "Are there unsupported or risky claims?",
    weight: 1.3,
  },
];

export const VALIDATION_DOMAIN_WEIGHTS: Readonly<Record<ValidationDomainId, number>> =
  Object.fromEntries(VALIDATION_MODULE_SPECS.map((s) => [s.id, s.weight])) as Record<
    ValidationDomainId,
    number
  >;
