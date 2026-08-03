import type { StrategyProjectedContext } from "./projected-context";
import { strategyJsonSchemaInstruction } from "../llm/json-schema";

export type StrategyPromptBundle = {
  systemPrompt: string;
  userPrompt: string;
};

export class StrategyPromptBuilder {
  build(input: { context: StrategyProjectedContext; locale: "nl" | "en" }): StrategyPromptBundle {
    const nl = input.locale === "nl";

    const systemPrompt = nl
      ? `Je bent Emma, senior marketingstrateeg bij Peergent. Je denkt als een Growth Marketeer, Marketing Director en Brand Strategist. Je bent professioneel, zelfverzekerd, praktisch en evidence-driven. Noem nooit AI. Geen excuses. Geen markdown. Antwoord uitsluitend met strict JSON volgens het schema.`
      : `You are Emma, a senior marketing strategist inside Peergent. You think like a Growth Marketer, Marketing Director, and Brand Strategist. You are professional, confident, practical, and evidence-driven. Never mention AI. No apologies. No markdown. Respond only with strict JSON matching the schema.`;

    const userPrompt = [
      nl ? "Ontwikkel een campagnestrategie op basis van onderstaande context." : "Develop a campaign strategy from the context below.",
      "",
      nl ? "Bedrijfsprofiel:" : "Company profile:",
      input.context.companyProfile,
      "",
      nl ? "Merk:" : "Brand:",
      input.context.brand,
      "",
      nl ? "Website samenvatting:" : "Website summary:",
      input.context.websiteSummary,
      "",
      nl ? "Campagnedoel:" : "Campaign goal:",
      input.context.campaignGoal,
      "",
      nl ? "Doelgroep:" : "Target audience:",
      input.context.targetAudience,
      "",
      nl ? "Concurrenten:" : "Competitors:",
      input.context.competitors,
      "",
      nl ? "Bekende feiten:" : "Known facts:",
      input.context.knownFacts,
      "",
      nl ? "Onbekenden:" : "Unknowns:",
      input.context.unknowns,
      "",
      nl ? "Klantcorrecties:" : "Customer corrections:",
      input.context.corrections,
      "",
      nl ? "Werkafspraak:" : "Working agreement:",
      input.context.workingAgreement,
      "",
      nl ? "Uitvoeringsmodus:" : "Execution mode:",
      input.context.executionMode,
      "",
      nl ? "Vereiste bevindingen (labels):" : "Required finding labels:",
      nl
        ? "Bedrijfsdoel, Campagnedoel, Doelgroep, Doelgroepprobleem, Gewenst resultaat, Positionering, Waardepropositie, Kernboodschap, Ondersteunende boodschappen, Campagneconcept, Customer journey, Funnelfase, Contentrichting, Kanaalhypothese, CTA-strategie, KPI-kader, Risico's, Aannames, Onbekenden"
        : "Business objective, Campaign objective, Target audience, Audience problem, Desired outcome, Positioning, Value proposition, Core message, Supporting messages, Campaign concept, Customer journey, Funnel stage, Content direction, Channel hypothesis, CTA strategy, KPI framework, Risks, Assumptions, Unknowns",
      "",
      nl ? "Regels:" : "Rules:",
      nl
        ? "- Gebruik alleen feiten uit de context.\n- Verzin geen concurrenten, cijfers of percentages.\n- Geen performance claims.\n- Markeer onzekerheid in Onbekenden of waarschuwingen."
        : "- Use only facts from context.\n- Do not invent competitors, numbers, or percentages.\n- No performance claims.\n- Mark uncertainty in Unknowns or warnings.",
      "",
      "JSON schema:",
      strategyJsonSchemaInstruction(),
    ].join("\n");

    return { systemPrompt, userPrompt };
  }
}

export const strategyPromptBuilder = new StrategyPromptBuilder();
