/**
 * Validation Brain graph builder — evaluates Creative Brain output across all domains.
 * Never creates, rewrites, or publishes — only evaluates.
 */

import type { CreativeDeliverable, CreativeGraph, CreativeMessaging } from "../creative/types";
import type { BrandGraph } from "../brand/types";
import { VALIDATION_MODULE_SPECS } from "./modules/specs";
import {
  buildScore,
  confidenceFromScore,
  estimateConversionScore,
  resolvePublicationReadiness,
  weightedOverallScore,
} from "./scoring";
import type {
  BrandRisk,
  BusinessRisk,
  OptionalImprovement,
  RequiredFix,
  ValidationBrainInput,
  ValidationCategory,
  ValidationCategoryStatus,
  ValidationDecision,
  ValidationDomainId,
  ValidationGraph,
  ValidationIssue,
  ValidationPass,
  ValidationPhaseRecord,
  ValidationReport,
  ValidationWarning,
} from "./types";
import { VALIDATION_LAYER_VERSION } from "./types";

type DomainEvaluation = {
  category: ValidationCategory;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  passes: ValidationPass[];
  businessRisks: BusinessRisk[];
  brandRisks: BrandRisk[];
};

type EvalContext = {
  input: ValidationBrainInput;
  creative: CreativeGraph;
  nl: boolean;
  at: string;
  selectedCampaign: CreativeGraph["campaigns"][number] | null;
  primaryMessaging: CreativeMessaging | null;
  brandTone: string;
  businessObjective: string;
  audienceTarget: string;
  positioningText: string;
};

const UNSUPPORTED_CLAIM_PATTERNS = [
  /\bbest in\b/i,
  /\bbeste in\b/i,
  /\bnumber one\b/i,
  /\bnummer 1\b/i,
  /\b#1\b/,
  /\bguaranteed?\b/i,
  /\bgarantie\b/i,
  /\b100%\s*(success|guarantee|result)/i,
  /\bworld'?s best\b/i,
  /\bwerelds beste\b/i,
  /\bnever fail/i,
  /\baltijd succes\b/i,
];

const GENERIC_HOOK_PATTERNS = [
  /\bdiscover how\b/i,
  /\bontdek hoe\b/i,
  /\bunlock\b/i,
  /\brevolutionary\b/i,
  /\bgame[- ]?chang/i,
  /\btransform your\b/i,
  /\bverander je\b/i,
  /\bthe future of\b/i,
  /\bde toekomst van\b/i,
  /\bclick here\b/i,
  /\blearn more\b/i,
  /\bmeer informatie\b/i,
];

const COMPETITOR_GENERIC_PATTERNS = [
  /\ball[- ]in[- ]one\b/i,
  /\bone[- ]stop\b/i,
  /\bseamless\b/i,
  /\bnaadloos\b/i,
  /\bpowerful platform\b/i,
  /\bkrachtig platform\b/i,
  /\bstreamline\b/i,
  /\bautomate everything\b/i,
];

function uid(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function allCopyText(creative: CreativeGraph): string {
  const parts: string[] = [];
  for (const m of creative.messaging) {
    parts.push(m.headline, m.supportingMessage, m.cta, ...m.proof);
  }
  for (const d of creative.deliverables) {
    parts.push(d.headline, d.hook, d.bodyOutline, d.cta, ...d.headlineVariations, ...d.hookVariations);
  }
  if (creative.direction) parts.push(creative.direction.name, creative.direction.angle);
  return parts.join(" ").toLowerCase();
}

function brandFactValue(brand: BrandGraph | null | undefined, concept: string): string {
  if (!brand) return "";
  const fact = brand.model.facts.find((f) => f.concept === concept);
  return fact?.value?.trim() ?? "";
}

function categoryStatus(score: number, hasBlocking: boolean, hasFail: boolean): ValidationCategoryStatus {
  if (hasBlocking || hasFail) return "fail";
  if (score < 75) return "warning";
  return "pass";
}

function buildCategory(
  id: ValidationDomainId,
  label: string,
  score: number,
  summary: string,
  at: string,
  hasBlocking: boolean,
  hasFail: boolean
): ValidationCategory {
  return {
    id,
    label,
    status: categoryStatus(score, hasBlocking, hasFail),
    score: buildScore(score),
    summary,
    evaluatedAt: at,
  };
}

function findUnsupportedClaims(text: string): string[] {
  const matches: string[] = [];
  for (const pattern of UNSUPPORTED_CLAIM_PATTERNS) {
    const match = text.match(pattern);
    if (match) matches.push(match[0]);
  }
  return matches;
}

function countGenericPatterns(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function deliverablesForChannel(creative: CreativeGraph, channel: string): CreativeDeliverable[] {
  return creative.deliverables.filter(
    (d) => d.channel.toLowerCase().includes(channel.toLowerCase())
  );
}

function evaluateBusinessFit(ctx: EvalContext): DomainEvaluation {
  const { creative, nl, at, businessObjective, selectedCampaign } = ctx;
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];
  const businessRisks: BusinessRisk[] = [];

  const campaignObjective = selectedCampaign?.objective?.toLowerCase() ?? "";
  const businessValue = selectedCampaign?.businessValue?.toLowerCase() ?? "";
  const objectiveAligned =
    businessObjective.length > 0 &&
    (campaignObjective.includes(businessObjective.slice(0, 20)) ||
      businessValue.includes(businessObjective.slice(0, 15)) ||
      creative.direction?.rationale?.toLowerCase().includes(businessObjective.slice(0, 15)));

  let score = 70;
  if (!selectedCampaign) {
    score = 20;
    issues.push({
      id: uid("biz", 1),
      category: "business_fit",
      severity: "critical",
      reason: nl ? "Geen geselecteerd campagneconcept om te valideren." : "No selected campaign concept to validate.",
      businessImpact: nl ? "Campagne kan bedrijfsdoel niet adresseren." : "Campaign cannot address business objective.",
      suggestedResolution: nl ? "Selecteer een campagneconcept met duidelijk bedrijfsdoel." : "Select a campaign concept with clear business objective.",
      blocking: true,
    });
  } else if (objectiveAligned || selectedCampaign.businessValue.length > 20) {
    score = 90;
    passes.push({
      id: uid("biz-pass", 1),
      category: "business_fit",
      reason: nl
        ? "Campagneconcept koppelt aan bedrijfsdoel en waarde."
        : "Campaign concept connects to business objective and value.",
    });
  } else {
    score = 55;
    warnings.push({
      id: uid("biz-warn", 1),
      category: "business_fit",
      reason: nl ? "Koppeling met bedrijfsdoel is impliciet, niet expliciet." : "Connection to business objective is implicit, not explicit.",
      businessImpact: nl ? "Lagere conversie door onduidelijke waarde." : "Lower conversion from unclear value proposition.",
      suggestedResolution: nl ? "Versterk business value in key message." : "Strengthen business value in key message.",
    });
  }

  const blocking = issues.some((i) => i.blocking);
  return {
    category: buildCategory(
      "business_fit",
      nl ? "Bedrijfsfit" : "Business Fit",
      score,
      selectedCampaign?.businessValue ?? (nl ? "Geen campagne geselecteerd." : "No campaign selected."),
      at,
      blocking,
      score < 50
    ),
    issues,
    warnings,
    passes,
    businessRisks,
    brandRisks: [],
  };
}

function evaluateBrandConsistency(ctx: EvalContext): DomainEvaluation {
  const { creative, brandTone, nl, at } = ctx;
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];
  const brandRisks: BrandRisk[] = [];

  const copy = allCopyText(creative);
  let score = 75;

  if (brandTone.length > 0) {
    const toneWords = brandTone.toLowerCase().split(/[\s,;/]+/).filter((w) => w.length > 3);
    const matched = toneWords.filter((w) => copy.includes(w));
    if (matched.length >= Math.min(2, toneWords.length)) {
      score = 88;
      passes.push({
        id: uid("brand-pass", 1),
        category: "brand_consistency",
        reason: nl ? "Messaging reflecteert merkidentiteit." : "Messaging reflects brand identity.",
      });
    } else if (toneWords.length > 0) {
      score = 62;
      warnings.push({
        id: uid("brand-warn", 1),
        category: "brand_consistency",
        reason: nl ? "Merktoon is niet duidelijk zichtbaar in copy." : "Brand tone is not clearly visible in copy.",
        businessImpact: nl ? "Merkherkenning kan afnemen." : "Brand recognition may decrease.",
        suggestedResolution: nl ? "Integreer merkpersoonlijkheid in headlines." : "Integrate brand personality into headlines.",
      });
      brandRisks.push({
        id: uid("brand-risk", 1),
        category: "brand_consistency",
        risk: nl ? "Merkafwijking in campagnecopy." : "Brand drift in campaign copy.",
        severity: "medium",
        mitigation: nl ? "Herschrijf met brand voice referentie." : "Rewrite with brand voice reference.",
      });
    }
  } else {
    score = 70;
    passes.push({
      id: uid("brand-pass", 2),
      category: "brand_consistency",
      reason: nl ? "Geen brand graph — basischeck op consistentie." : "No brand graph — baseline consistency check.",
    });
  }

  return {
    category: buildCategory(
      "brand_consistency",
      nl ? "Merkconsistentie" : "Brand Consistency",
      score,
      nl ? "Messaging vs merkidentiteit." : "Messaging vs brand identity.",
      at,
      false,
      score < 50
    ),
    issues,
    warnings,
    passes,
    brandRisks,
    businessRisks: [],
  };
}

function evaluateToneOfVoice(ctx: EvalContext): DomainEvaluation {
  const { creative, brandTone, nl, at } = ctx;
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];

  const copy = allCopyText(creative);
  const exclamationCount = (copy.match(/!/g) ?? []).length;
  const allCapsWords = (copy.match(/\b[A-Z]{4,}\b/g) ?? []).length;

  let score = 80;
  if (exclamationCount > 5 || allCapsWords > 2) {
    score = 58;
    warnings.push({
      id: uid("tone-warn", 1),
      category: "tone_of_voice",
      reason: nl ? "Copy voelt te agressief of schreeuwerig." : "Copy feels too aggressive or shouty.",
      businessImpact: nl ? "Premium merkgevoel kan lijden." : "Premium brand feel may suffer.",
      suggestedResolution: nl ? "Verlaag intensiteit — kalme, zelfverzekerde toon." : "Reduce intensity — calm, confident tone.",
    });
  } else if (brandTone.toLowerCase().includes("professional") || brandTone.toLowerCase().includes("premium")) {
    score = 85;
    passes.push({
      id: uid("tone-pass", 1),
      category: "tone_of_voice",
      reason: nl ? "Toon past bij premium positionering." : "Tone matches premium positioning.",
    });
  } else {
    passes.push({
      id: uid("tone-pass", 2),
      category: "tone_of_voice",
      reason: nl ? "Toon is acceptabel voor publicatie." : "Tone is acceptable for publication.",
    });
  }

  return {
    category: buildCategory(
      "tone_of_voice",
      nl ? "Tone of Voice" : "Tone of Voice",
      score,
      nl ? "Communicatiestijl geëvalueerd." : "Communication style evaluated.",
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateAudienceFit(ctx: EvalContext): DomainEvaluation {
  const { creative, audienceTarget, nl, at, selectedCampaign } = ctx;
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];

  const campaignAudience = selectedCampaign?.targetAudience?.toLowerCase() ?? "";
  const aligned =
    audienceTarget.length > 0 &&
    (campaignAudience.includes(audienceTarget.slice(0, 12)) ||
      audienceTarget.includes(campaignAudience.slice(0, 12)));

  let score = aligned ? 88 : campaignAudience.length > 10 ? 72 : 55;

  if (aligned) {
    passes.push({
      id: uid("aud-pass", 1),
      category: "audience_fit",
      reason: nl ? "Doelgroep komt overeen met strategie." : "Target audience matches strategy.",
    });
  } else if (campaignAudience.length > 0) {
    warnings.push({
      id: uid("aud-warn", 1),
      category: "audience_fit",
      reason: nl ? "Doelgroep wijkt af van strategische audience." : "Target audience diverges from strategic audience.",
      businessImpact: nl ? "Relevantie voor primaire doelgroep kan dalen." : "Relevance to primary audience may decrease.",
      suggestedResolution: nl ? "Stem taal af op primaire doelgroep." : "Align language to primary audience.",
    });
  }

  const jargonCount = countGenericPatterns(allCopyText(creative), [/\bsynergy\b/i, /\bleverage\b/i, /\bparadigm\b/i]);
  if (jargonCount > 0) score -= 10;

  return {
    category: buildCategory(
      "audience_fit",
      nl ? "Doelgroepfit" : "Audience Fit",
      score,
      selectedCampaign?.targetAudience ?? (nl ? "Geen doelgroep gedefinieerd." : "No audience defined."),
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluatePositioning(ctx: EvalContext): DomainEvaluation {
  const { creative, positioningText, nl, at } = ctx;
  const passes: ValidationPass[] = [];
  const warnings: ValidationWarning[] = [];

  const direction = creative.direction;
  let score = direction ? 82 : 40;

  if (direction) {
    const angleLower = direction.angle.toLowerCase();
    const positioningAligned =
      positioningText.length > 0 && angleLower.includes(positioningText.slice(0, 15).toLowerCase());

    if (positioningAligned || direction.rationale.length > 30) {
      score = 90;
      passes.push({
        id: uid("pos-pass", 1),
        category: "positioning",
        reason: nl ? "Creatieve richting versterkt positionering." : "Creative direction strengthens positioning.",
      });
    } else {
      score = 68;
      warnings.push({
        id: uid("pos-warn", 1),
        category: "positioning",
        reason: nl ? "Positionering is creatief maar losgekoppeld van strategie." : "Positioning is creative but loosely tied to strategy.",
        businessImpact: nl ? "Marktpositie wordt niet maximaal versterkt." : "Market position is not maximally strengthened.",
        suggestedResolution: nl ? "Koppel angle expliciet aan strategische positionering." : "Explicitly tie angle to strategic positioning.",
      });
    }
  }

  return {
    category: buildCategory(
      "positioning",
      nl ? "Positionering" : "Positioning",
      score,
      direction?.angle ?? (nl ? "Geen richting." : "No direction."),
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateCompetitiveDifferentiation(ctx: EvalContext): DomainEvaluation {
  const { creative, nl, at } = ctx;
  const copy = allCopyText(creative);
  const genericCount = countGenericPatterns(copy, COMPETITOR_GENERIC_PATTERNS);
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];

  let score = Math.max(40, 90 - genericCount * 15);

  if (genericCount === 0) {
    passes.push({
      id: uid("diff-pass", 1),
      category: "competitive_differentiation",
      reason: nl ? "Copy vermijdt generieke concurrent-taal." : "Copy avoids generic competitor language.",
    });
  } else {
    warnings.push({
      id: uid("diff-warn", 1),
      category: "competitive_differentiation",
      reason: nl
        ? "Messaging klinkt als standaard SaaS-marketing."
        : "Messaging sounds like standard SaaS marketing.",
      businessImpact: nl ? "Moeilijk te onderscheiden in markt." : "Hard to differentiate in market.",
      suggestedResolution: nl ? "Gebruik specifieke differentiators uit strategie." : "Use specific differentiators from strategy.",
    });
  }

  return {
    category: buildCategory(
      "competitive_differentiation",
      nl ? "Concurrentiële differentiatie" : "Competitive Differentiation",
      score,
      nl ? `${genericCount} generieke patronen gedetecteerd.` : `${genericCount} generic patterns detected.`,
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateCreativeQuality(ctx: EvalContext): DomainEvaluation {
  const { creative, nl, at } = ctx;
  const copy = allCopyText(creative);
  const genericHooks = countGenericPatterns(copy, GENERIC_HOOK_PATTERNS);
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];

  let score = Math.max(45, 88 - genericHooks * 12);

  if (creative.direction && creative.direction.emotion.length > 5) score += 5;

  if (genericHooks === 0 && creative.deliverables.some((d) => d.hookVariations.length >= 2)) {
    passes.push({
      id: uid("cq-pass", 1),
      category: "creative_quality",
      reason: nl ? "Concept is origineel genoeg voor publicatie." : "Concept is original enough for publication.",
    });
  } else if (genericHooks > 0) {
    warnings.push({
      id: uid("cq-warn", 1),
      category: "creative_quality",
      reason: nl ? "Hook te generiek — verwacht lagere CTR." : "Hook too generic — expected CTR reduction.",
      businessImpact: nl ? "Engagement kan onder benchmark blijven." : "Engagement may stay below benchmark.",
      suggestedResolution: nl ? "Vervang generieke hook door specifieke invalshoek." : "Replace generic hook with specific angle.",
    });
  }

  return {
    category: buildCategory(
      "creative_quality",
      nl ? "Creatieve kwaliteit" : "Creative Quality",
      score,
      nl ? "Originaliteit en conceptsterkte." : "Originality and concept strength.",
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateMessageClarity(ctx: EvalContext): DomainEvaluation {
  const { creative, nl, at, primaryMessaging } = ctx;
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];

  const headline = primaryMessaging?.headline ?? creative.deliverables[0]?.headline ?? "";
  let score = 75;

  if (headline.length > 0 && headline.length <= 80) {
    score = 85;
    passes.push({
      id: uid("clarity-pass", 1),
      category: "message_clarity",
      reason: nl ? "Headline is scanbaar binnen seconden." : "Headline is scannable within seconds.",
    });
  } else if (headline.length > 80) {
    score = 58;
    warnings.push({
      id: uid("clarity-warn", 1),
      category: "message_clarity",
      reason: nl ? "Headline is te lang voor snelle begrip." : "Headline is too long for quick comprehension.",
      businessImpact: nl ? "Bounce rate kan stijgen." : "Bounce rate may increase.",
      suggestedResolution: nl ? "Verkort headline tot kernboodschap." : "Shorten headline to core message.",
    });
  }

  return {
    category: buildCategory(
      "message_clarity",
      nl ? "Boodschaphelderheid" : "Message Clarity",
      score,
      headline.slice(0, 80) || (nl ? "Geen headline." : "No headline."),
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateTrust(ctx: EvalContext): DomainEvaluation {
  const { creative, nl, at, primaryMessaging } = ctx;
  const trustBuilders = primaryMessaging?.trustBuilders ?? [];
  const proof = primaryMessaging?.proof ?? [];
  const passes: ValidationPass[] = [];
  const warnings: ValidationWarning[] = [];

  let score = 60;
  const totalTrust = trustBuilders.length + proof.length;

  if (totalTrust >= 3) {
    score = 90;
    passes.push({
      id: uid("trust-pass", 1),
      category: "trust",
      reason: nl ? "Voldoende trust builders en proof points." : "Sufficient trust builders and proof points.",
    });
  } else if (totalTrust >= 1) {
    score = 72;
    warnings.push({
      id: uid("trust-warn", 1),
      category: "trust",
      reason: nl ? "Trust builders zijn minimaal aanwezig." : "Trust builders are minimally present.",
      businessImpact: nl ? "Conversie kan lager zijn zonder social proof." : "Conversion may be lower without social proof.",
      suggestedResolution: nl ? "Voeg case studies of testimonials toe." : "Add case studies or testimonials.",
    });
  } else {
    score = 45;
    warnings.push({
      id: uid("trust-warn", 2),
      category: "trust",
      reason: nl ? "Geen trust builders in messaging." : "No trust builders in messaging.",
      businessImpact: nl ? "Prospects hebben weinig reden om te geloven." : "Prospects have little reason to believe.",
      suggestedResolution: nl ? "Voeg proof points toe aan messaging framework." : "Add proof points to messaging framework.",
    });
  }

  return {
    category: buildCategory(
      "trust",
      nl ? "Vertrouwen" : "Trust",
      score,
      nl ? `${totalTrust} trust elementen.` : `${totalTrust} trust elements.`,
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateObjections(ctx: EvalContext): DomainEvaluation {
  const { creative, nl, at, primaryMessaging } = ctx;
  const objections = primaryMessaging?.objections ?? [];
  const passes: ValidationPass[] = [];
  const warnings: ValidationWarning[] = [];

  let score = objections.length >= 2 ? 88 : objections.length === 1 ? 72 : 55;

  if (objections.length >= 2) {
    passes.push({
      id: uid("obj-pass", 1),
      category: "objections",
      reason: nl ? "Belangrijkste bezwaren zijn geadresseerd." : "Key objections are addressed.",
    });
  } else {
    warnings.push({
      id: uid("obj-warn", 1),
      category: "objections",
      reason: nl ? "Onvoldoende bezwaren geadresseerd." : "Insufficient objections addressed.",
      businessImpact: nl ? "Prospects blijven hangen op twijfels." : "Prospects remain stuck on doubts.",
      suggestedResolution: nl ? "Voeg minimaal 2 bezwaren + responses toe." : "Add at least 2 objections + responses.",
    });
  }

  return {
    category: buildCategory(
      "objections",
      nl ? "Bezwaren" : "Objections",
      score,
      nl ? `${objections.length} bezwaren geadresseerd.` : `${objections.length} objections addressed.`,
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateChannel(
  ctx: EvalContext,
  domainId: ValidationDomainId,
  channelKey: string,
  label: string,
  minHookLength: number,
  maxHeadlineLength: number
): DomainEvaluation {
  const { creative, nl, at } = ctx;
  const deliverables = deliverablesForChannel(creative, channelKey);
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];

  if (deliverables.length === 0) {
    return {
      category: buildCategory(domainId, label, 100, nl ? "Kanaal niet in scope." : "Channel not in scope.", at, false, false),
      issues: [],
      warnings: [],
      passes: [{
        id: uid(`${domainId}-skip`, 1),
        category: domainId,
        reason: nl ? "Geen deliverables voor dit kanaal." : "No deliverables for this channel.",
      }],
      businessRisks: [],
      brandRisks: [],
    };
  }

  let score = 85;
  for (const [i, del] of deliverables.entries()) {
    if (del.hook.length < minHookLength) {
      score -= 15;
      warnings.push({
        id: uid(`${domainId}-warn`, i + 1),
        category: domainId,
        reason: nl ? `Hook te kort voor ${channelKey}.` : `Hook too short for ${channelKey}.`,
        businessImpact: nl ? "Verwachte CTR reductie." : "Expected CTR reduction.",
        suggestedResolution: nl ? "Versterk opening hook." : "Strengthen opening hook.",
        deliverableId: del.id,
      });
    }
    if (del.headline.length > maxHeadlineLength) {
      score -= 10;
      warnings.push({
        id: uid(`${domainId}-head`, i + 1),
        category: domainId,
        reason: nl ? `Headline te lang voor ${channelKey}.` : `Headline too long for ${channelKey}.`,
        businessImpact: nl ? "Truncatie op platform." : "Truncation on platform.",
        suggestedResolution: nl ? "Verkort headline." : "Shorten headline.",
        deliverableId: del.id,
      });
    }
    const claims = findUnsupportedClaims(`${del.headline} ${del.hook} ${del.bodyOutline}`);
    if (claims.length > 0) {
      score -= 25;
      issues.push({
        id: uid(`${domainId}-issue`, i + 1),
        category: domainId,
        severity: "high",
        reason: nl ? `Niet onderbouwbare claim: "${claims[0]}".` : `Unsubstantiated claim: "${claims[0]}".`,
        businessImpact: nl ? "Compliance risico op kanaal." : "Compliance risk on channel.",
        suggestedResolution: nl ? "Verwijder of onderbouw claim." : "Remove or substantiate claim.",
        blocking: false,
        deliverableId: del.id,
        channel: channelKey,
      });
    }
  }

  if (issues.length === 0 && warnings.length === 0) {
    passes.push({
      id: uid(`${domainId}-pass`, 1),
      category: domainId,
      reason: nl ? `${label} voldoet aan kanaaleisen.` : `${label} meets channel requirements.`,
    });
  }

  return {
    category: buildCategory(domainId, label, Math.max(40, score), nl ? `${deliverables.length} deliverables.` : `${deliverables.length} deliverables.`, at, false, score < 50),
    issues,
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateCtaQuality(ctx: EvalContext): DomainEvaluation {
  const { creative, nl, at } = ctx;
  const ctas = new Set(creative.deliverables.map((d) => d.cta.trim().toLowerCase()).filter(Boolean));
  const messagingCta = creative.messaging[0]?.cta?.trim().toLowerCase() ?? "";
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];

  let score = 80;
  if (ctas.size > 3) {
    score = 55;
    warnings.push({
      id: uid("cta-warn", 1),
      category: "cta_quality",
      reason: nl ? "Te veel verschillende CTAs — geen enkele duidelijke actie." : "Too many different CTAs — no single clear action.",
      businessImpact: nl ? "Conversie frictie door keuzestress." : "Conversion friction from choice overload.",
      suggestedResolution: nl ? "Consolideer naar één primaire CTA." : "Consolidate to one primary CTA.",
    });
  } else if (messagingCta.length > 0) {
    score = 88;
    passes.push({
      id: uid("cta-pass", 1),
      category: "cta_quality",
      reason: nl ? "Eén duidelijke volgende actie." : "One clear next action.",
    });
  }

  return {
    category: buildCategory(
      "cta_quality",
      nl ? "CTA-kwaliteit" : "CTA Quality",
      score,
      nl ? `${ctas.size} unieke CTAs.` : `${ctas.size} unique CTAs.`,
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateConversionPotential(ctx: EvalContext, trustScore: number, ctaScore: number): DomainEvaluation {
  const { creative, nl, at } = ctx;
  const hasLanding = deliverablesForChannel(creative, "landing").length > 0;
  const hasEmail = deliverablesForChannel(creative, "email").length > 0;
  let score = (trustScore + ctaScore) / 2;
  if (hasLanding && hasEmail) score += 8;

  return {
    category: buildCategory(
      "conversion_potential",
      nl ? "Conversiepotentieel" : "Conversion Potential",
      score,
      nl ? "Composiet conversiescore." : "Composite conversion score.",
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings: [],
    passes: [{
      id: uid("conv-pass", 1),
      category: "conversion_potential",
      reason: nl ? `Geschat conversiepotentieel: ${Math.round(score)}%.` : `Estimated conversion potential: ${Math.round(score)}%.`,
    }],
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateConsistency(ctx: EvalContext): DomainEvaluation {
  const { creative, nl, at, primaryMessaging } = ctx;
  const keyMessage = primaryMessaging?.headline?.toLowerCase() ?? "";
  const warnings: ValidationWarning[] = [];
  const passes: ValidationPass[] = [];

  let aligned = 0;
  for (const del of creative.deliverables) {
    if (keyMessage.length > 0 && del.headline.toLowerCase().includes(keyMessage.slice(0, 15))) {
      aligned++;
    }
  }

  const ratio = creative.deliverables.length > 0 ? aligned / creative.deliverables.length : 1;
  let score = Math.round(60 + ratio * 35);

  if (ratio >= 0.7) {
    passes.push({
      id: uid("cons-pass", 1),
      category: "consistency",
      reason: nl ? "Deliverables vertellen hetzelfde verhaal." : "Deliverables tell the same story.",
    });
  } else {
    warnings.push({
      id: uid("cons-warn", 1),
      category: "consistency",
      reason: nl ? "Deliverables wijken af van kernboodschap." : "Deliverables diverge from core message.",
      businessImpact: nl ? "Campagne voelt gefragmenteerd." : "Campaign feels fragmented.",
      suggestedResolution: nl ? "Align headlines met messaging framework." : "Align headlines with messaging framework.",
    });
  }

  return {
    category: buildCategory(
      "consistency",
      nl ? "Consistentie" : "Consistency",
      score,
      nl ? `${Math.round(ratio * 100)}% aligned.` : `${Math.round(ratio * 100)}% aligned.`,
      at,
      false,
      score < 50
    ),
    issues: [],
    warnings,
    passes,
    businessRisks: [],
    brandRisks: [],
  };
}

function evaluateLegalClaims(ctx: EvalContext): DomainEvaluation {
  const { creative, nl, at } = ctx;
  const copy = allCopyText(creative);
  const claims = findUnsupportedClaims(copy);
  const issues: ValidationIssue[] = [];
  const passes: ValidationPass[] = [];
  const businessRisks: BusinessRisk[] = [];

  let score = claims.length === 0 ? 95 : Math.max(20, 95 - claims.length * 30);

  for (const [i, claim] of claims.entries()) {
    issues.push({
      id: uid("legal", i + 1),
      category: "legal_claims",
      severity: "critical",
      reason: nl
        ? `Claim "${claim}" kan niet worden onderbouwd.`
        : `Claim "${claim}" cannot be substantiated.`,
      businessImpact: nl ? "Juridisch en reputatierisico bij publicatie." : "Legal and reputational risk on publication.",
      suggestedResolution: nl ? "Verwijder claim of voeg bewijs toe." : "Remove claim or add evidence.",
      blocking: true,
    });
    businessRisks.push({
      id: uid("legal-risk", i + 1),
      category: "legal_claims",
      risk: nl ? `Ononderbouwde claim: ${claim}` : `Unsupported claim: ${claim}`,
      severity: "critical",
      mitigation: nl ? "Verwijder of onderbouw met data." : "Remove or substantiate with data.",
    });
  }

  if (claims.length === 0) {
    passes.push({
      id: uid("legal-pass", 1),
      category: "legal_claims",
      reason: nl ? "Geen riskante claims gedetecteerd." : "No risky claims detected.",
    });
  }

  const blocking = issues.some((i) => i.blocking);
  return {
    category: buildCategory(
      "legal_claims",
      nl ? "Legal & Claims" : "Legal & Claims",
      score,
      claims.length === 0
        ? (nl ? "Geen problematische claims." : "No problematic claims.")
        : (nl ? `${claims.length} claim(s) vereisen actie.` : `${claims.length} claim(s) require action.`),
      at,
      blocking,
      claims.length > 0
    ),
    issues,
    warnings: [],
    passes,
    businessRisks,
    brandRisks: [],
  };
}

function buildDeliverableDecisions(
  creative: CreativeGraph,
  issues: readonly ValidationIssue[],
  nl: boolean
): { approved: ValidationDecision[]; rejected: ValidationDecision[] } {
  const rejectedIds = new Set(
    issues.filter((i) => i.blocking && i.deliverableId).map((i) => i.deliverableId!)
  );
  const warnedIds = new Set(
    issues.filter((i) => !i.blocking && i.deliverableId).map((i) => i.deliverableId!)
  );

  const approved: ValidationDecision[] = [];
  const rejected: ValidationDecision[] = [];

  for (const del of creative.deliverables) {
    const decision: ValidationDecision = {
      id: `val-dec-${del.id}`,
      deliverableId: del.id,
      deliverableType: del.type,
      channel: del.channel,
      approved: !rejectedIds.has(del.id),
      reason: rejectedIds.has(del.id)
        ? (nl ? "Geblokkeerd door validatie-issue." : "Blocked by validation issue.")
        : warnedIds.has(del.id)
          ? (nl ? "Goedgekeurd met waarschuwingen." : "Approved with warnings.")
          : (nl ? "Voldoet aan kwaliteitsdrempel." : "Meets quality threshold."),
    };
    if (decision.approved) approved.push(decision);
    else rejected.push(decision);
  }

  return { approved, rejected };
}

/** Build complete ValidationGraph from Creative Brain output and upstream context. */
export function buildValidationGraph(input: ValidationBrainInput): ValidationGraph {
  const at = new Date().toISOString();
  const nl = input.locale === "nl";
  const creative = input.creativeGraph;

  const selectedCampaign = creative.campaigns.find((c) => c.selected) ?? creative.campaigns[0] ?? null;
  const primaryMessaging = creative.messaging[0] ?? null;

  const businessObjective =
    input.campaignContext?.goals[0] ??
    input.strategyGraph?.businessSummary?.description?.slice(0, 80) ??
    selectedCampaign?.objective ??
    "";

  const audienceTarget =
    input.campaignContext?.audience ??
    input.strategyGraph?.primaryAudience?.description?.slice(0, 80) ??
    selectedCampaign?.targetAudience ??
    "";

  const positioningText =
    input.strategyGraph?.strategicPositioning?.description ??
    creative.direction?.angle ??
    "";

  const brandTone = brandFactValue(input.brandGraph, "tone_of_voice");

  const ctx: EvalContext = {
    input,
    creative,
    nl,
    at,
    selectedCampaign,
    primaryMessaging,
    brandTone,
    businessObjective,
    audienceTarget,
    positioningText,
  };

  const domainEvaluators: Array<(c: EvalContext) => DomainEvaluation> = [
    evaluateBusinessFit,
    evaluateBrandConsistency,
    evaluateToneOfVoice,
    evaluateAudienceFit,
    evaluatePositioning,
    evaluateCompetitiveDifferentiation,
    evaluateCreativeQuality,
    evaluateMessageClarity,
    evaluateTrust,
    evaluateObjections,
    (c) => evaluateChannel(c, "channel_linkedin", "linkedin", nl ? "LinkedIn" : "LinkedIn", 20, 120),
    (c) => evaluateChannel(c, "channel_google_ads", "google", nl ? "Google Ads" : "Google Ads", 10, 90),
    (c) => evaluateChannel(c, "channel_email", "email", nl ? "Email" : "Email", 15, 100),
    (c) => evaluateChannel(c, "channel_landing_page", "landing", nl ? "Landing Page" : "Landing Page", 25, 80),
    (c) => evaluateChannel(c, "channel_blog", "blog", nl ? "Blog" : "Blog", 40, 150),
    evaluateCtaQuality,
  ];

  const results = domainEvaluators.map((fn) => fn(ctx));

  const trustScore = results.find((r) => r.category.id === "trust")?.category.score.value ?? 70;
  const ctaScore = results.find((r) => r.category.id === "cta_quality")?.category.score.value ?? 70;

  results.push(evaluateConversionPotential(ctx, trustScore, ctaScore));
  results.push(evaluateConsistency(ctx));
  results.push(evaluateLegalClaims(ctx));

  const categories = results.map((r) => r.category);
  const issues = results.flatMap((r) => r.issues);
  const warnings = results.flatMap((r) => r.warnings);
  const passes = results.flatMap((r) => r.passes);
  const businessRisks = results.flatMap((r) => r.businessRisks);
  const brandRisks = results.flatMap((r) => r.brandRisks);

  const overallScore = weightedOverallScore(categories);
  const publicationReadiness = resolvePublicationReadiness({
    overallScore: overallScore.value,
    issues,
    categories,
  });

  const requiredFixes: RequiredFix[] = issues.map((issue) => ({
    issueId: issue.id,
    category: issue.category,
    summary: issue.reason,
    blocking: issue.blocking,
  }));

  const optionalImprovements: OptionalImprovement[] = warnings.map((w) => ({
    warningId: w.id,
    category: w.category,
    summary: w.reason,
    expectedImpact: w.businessImpact,
  }));

  const { approved, rejected } = buildDeliverableDecisions(creative, issues, nl);

  const reasoningSummary = nl
    ? `Validatie voltooid: ${publicationReadiness}. ${issues.length} issues, ${warnings.length} waarschuwingen, ${passes.length} passes.`
    : `Validation complete: ${publicationReadiness}. ${issues.length} issues, ${warnings.length} warnings, ${passes.length} passes.`;

  const report: ValidationReport = {
    version: VALIDATION_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.projectId,
    episodeId: input.episodeId,
    createdAt: at,
    overallScore,
    publicationReadiness,
    categories,
    issues,
    warnings,
    passes,
    requiredFixes,
    optionalImprovements,
    businessRisks,
    brandRisks,
    approvedDeliverables: approved,
    rejectedDeliverables: rejected,
    reasoningSummary,
    confidence: confidenceFromScore(overallScore.value, issues.length),
    estimatedQuality: overallScore,
    estimatedConversion: estimateConversionScore({
      overallScore: overallScore.value,
      issues,
      warnings,
      ctaScore,
      trustScore,
    }),
  };

  const phases: ValidationPhaseRecord[] = categories.map((cat) => ({
    domain: cat.id,
    completedAt: cat.evaluatedAt,
    summary: cat.summary,
    status: cat.status,
    issueCount: issues.filter((i) => i.category === cat.id).length,
  }));

  const creativeGraphRef = `creative:${input.organizationId}:${input.projectId}:${creative.createdAt}`;

  return {
    version: VALIDATION_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.projectId,
    episodeId: input.episodeId,
    createdAt: at,
    creativeGraphRef,
    report,
    phases,
    confidence: report.confidence,
  };
}

export function buildValidationSummary(graph: ValidationGraph): import("./types").ValidationSummary {
  const { report } = graph;
  return {
    publicationReadiness: report.publicationReadiness,
    overallScore: report.overallScore.value,
    blockingIssueCount: report.issues.filter((i) => i.blocking).length,
    warningCount: report.warnings.length,
    approvedDeliverableCount: report.approvedDeliverables.length,
    rejectedDeliverableCount: report.rejectedDeliverables.length,
    confidence: report.confidence,
  };
}

export { VALIDATION_MODULE_SPECS };
