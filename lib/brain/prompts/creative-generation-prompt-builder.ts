import type { CreativeGenerationProjectedContext } from "./projected-context";
import {
  CREATIVE_CHANNEL_IDS,
  CREATIVE_DELIVERABLE_TYPES,
  CREATIVE_REVIEW_STATUSES,
} from "../llm/creative-generation-contract";
import {
  CREATIVE_GENERATION_MIN_DELIVERABLES,
  CREATIVE_GENERATION_MAX_DELIVERABLES,
  CREATIVE_GENERATION_MAX_KEY_POINTS,
} from "../llm/creative-generation-contract";
import { creativeGenerationJsonSchemaInstruction } from "../llm/json-schema";

export type CreativeGenerationPromptBundle = {
  systemPrompt: string;
  userPrompt: string;
};

export class CreativeGenerationPromptBuilder {
  build(input: { context: CreativeGenerationProjectedContext; locale: "nl" | "en" }): CreativeGenerationPromptBundle {
    const nl = input.locale === "nl";

    const systemPrompt = nl
      ? `Je bent Emma, senior marketingstrateeg bij Peergent. Je maakt gestructureerde campagne-deliverable plannen op basis van goedgekeurde strategie en kanalen. Geen final copy. Geen verzonnen cijfers. Geen testimonials. Geen markdown. Antwoord uitsluitend met strict JSON volgens het schema.`
      : `You are Emma, a senior marketing strategist inside Peergent. You produce structured campaign deliverable plans based on approved strategy and channels. No final copy. No invented metrics. No testimonials. No markdown. Respond only with strict JSON matching the schema.`;

    const userPrompt = [
      nl
        ? "Maak een deliverable-plan voor onderstaande campagne. Plan alleen — geen publish-ready copy."
        : "Build a deliverable plan for the campaign below. Planning only — no publish-ready copy.",
      "",
      nl ? "Bedrijf & merk:" : "Company & brand:",
      input.context.companyBrandSummary,
      "",
      nl ? "Campagnedoel:" : "Campaign goal:",
      input.context.campaignGoal,
      "",
      nl ? "Doelgroep:" : "Target audience:",
      input.context.targetAudience,
      "",
      nl ? "Goedgekeurde strategie:" : "Approved strategy:",
      input.context.strategySummary,
      "",
      nl ? "Goedgekeurde kanalen:" : "Approved channels:",
      input.context.approvedChannels,
      "",
      nl ? "Producten/diensten:" : "Products/services:",
      input.context.productsAndServices,
      "",
      nl ? "USPs:" : "USPs:",
      input.context.usps,
      "",
      nl ? "Tone of voice:" : "Tone of voice:",
      input.context.toneOfVoice,
      "",
      nl ? "Concurrentie (indien bekend):" : "Competitors (if known):",
      input.context.competitorObservations,
      "",
      nl ? "Website (indien bekend):" : "Website (if known):",
      input.context.websiteObservations,
      "",
      nl ? "Bekende feiten:" : "Known facts:",
      input.context.knownFacts,
      "",
      nl ? "Onbekenden:" : "Unknowns:",
      input.context.unknowns,
      "",
      nl ? "Uitvoeringsmodus:" : "Execution mode:",
      input.context.executionMode,
      "",
      nl ? "Goedkeuringsbeleid:" : "Approval policy:",
      input.context.approvalMode,
      "",
      nl ? "Regels:" : "Rules:",
      nl
        ? `- Plan ${CREATIVE_GENERATION_MIN_DELIVERABLES}–${CREATIVE_GENERATION_MAX_DELIVERABLES} deliverables voor de sterkste kanalen — niet één per kanaal tenzij expliciet nodig.\n- Maximaal ${CREATIVE_GENERATION_MAX_KEY_POINTS} kernpunten per deliverable.\n- Houd rationale, provenance, dependencies en assumptions beknopt.\n- Herhaal geen strategie- of kanaalanalyse.\n- Alleen deliverables voor goedgekeurde kanalen.\n- Gebruik exact deze veldnamen: deliverableType, channel, callToActionDirection, keyPoints, reviewStatus.\n- Geen final copy, geen percentages, geen performance claims.\n- Markeer onzekerheid in assumptions of warnings.\n- Elke deliverable heeft rationale en provenance.`
        : `- Plan ${CREATIVE_GENERATION_MIN_DELIVERABLES}–${CREATIVE_GENERATION_MAX_DELIVERABLES} deliverables for the strongest channels — not one per channel unless explicitly required.\n- At most ${CREATIVE_GENERATION_MAX_KEY_POINTS} key points per deliverable.\n- Keep rationale, provenance, dependencies, and assumptions concise.\n- Do not repeat strategy or channel analysis.\n- Only deliverables for approved channels.\n- Use exact field names: deliverableType, channel, callToActionDirection, keyPoints, reviewStatus.\n- No final copy, percentages, or performance claims.\n- Mark uncertainty in assumptions or warnings.\n- Every deliverable needs rationale and provenance.`,
      "",
      nl ? "Toegestane deliverableType waarden:" : "Allowed deliverableType values:",
      CREATIVE_DELIVERABLE_TYPES.join(", "),
      "",
      nl ? "Toegestane channel waarden:" : "Allowed channel values:",
      CREATIVE_CHANNEL_IDS.join(", "),
      "",
      nl ? "Toegestane reviewStatus waarden:" : "Allowed reviewStatus values:",
      CREATIVE_REVIEW_STATUSES.join(", "),
      "",
      "JSON schema:",
      creativeGenerationJsonSchemaInstruction(),
    ].join("\n");

    return { systemPrompt, userPrompt };
  }
}

export const creativeGenerationPromptBuilder = new CreativeGenerationPromptBuilder();
