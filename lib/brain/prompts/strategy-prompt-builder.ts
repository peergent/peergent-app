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
      ? `Je bent Emma, senior strategieconsultant bij Peergent. Je denkt als een ervaren strategy consultant — niet als copywriter, marketing-intern of contentgenerator. Je focus: begrip, besluitvorming, evidence. Noem nooit AI. Geen excuses. Geen markdown. Antwoord uitsluitend met strict JSON volgens het schema.`
      : `You are Emma, a senior strategy consultant inside Peergent. You think like an experienced strategy consultant — not a copywriter, marketing intern, or content generator. Focus: understanding, decision-making, evidence. Never mention AI. No apologies. No markdown. Respond only with strict JSON matching the schema.`;

    const userPrompt = [
      nl ? "Ontwikkel campagnestrategie op basis van ReasoningGraph (primair) en onderstaande context." : "Develop campaign strategy from ReasoningGraph (primary) and context below.",
      "",
      nl ? "ReasoningGraph (primair):" : "ReasoningGraph (primary):",
      input.context.reasoningSummary,
      "",
      nl ? "ResearchGraph:" : "ResearchGraph:",
      input.context.researchSummary,
      "",
      nl ? "Strategische thema's:" : "Strategic themes:",
      input.context.strategicThemes,
      "",
      nl ? "Prioritaire kansen:" : "Priority opportunities:",
      input.context.priorityOpportunities,
      "",
      nl ? "Strategische risico's:" : "Strategic risks:",
      input.context.strategicRisks,
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
      nl ? "Onbekenden:" : "Unknowns:",
      input.context.unknowns,
      "",
      nl ? "Vereiste bevindingen (labels):" : "Required finding labels:",
      nl
        ? "Bedrijfsdoel, Campagnedoel, Doelgroep, Doelgroepprobleem, Gewenst resultaat, Positionering, Waardepropositie, Kernboodschap, Ondersteunende boodschappen, Campagneconcept, Customer journey, Funnelfase, Contentrichting, Kanaalhypothese, CTA-strategie, KPI-kader, Risico's, Aannames, Onbekenden"
        : "Business objective, Campaign objective, Target audience, Audience problem, Desired outcome, Positioning, Value proposition, Core message, Supporting messages, Campaign concept, Customer journey, Funnel stage, Content direction, Channel hypothesis, CTA strategy, KPI framework, Risks, Assumptions, Unknowns",
      "",
      nl ? "Regels:" : "Rules:",
      nl
        ? "- Prioriteit: ReasoningGraph → ResearchGraph → legacy context.\n- Gebruik bedrijfsnaam en specifieke offer-details.\n- Verzin geen concurrenten, cijfers of personas.\n- Minstens twee afgewezen alternatieven in Beslissingen-rationale.\n- Behoud onbekenden — vervang nooit door aannames.\n- Geen advertentieteksten, headlines of deliverables.\n- Geen generieke marketingadviezen."
        : "- Priority: ReasoningGraph → ResearchGraph → legacy context.\n- Use company name and specific offer details.\n- Do not invent competitors, numbers, or personas.\n- Include at least two rejected alternatives in Decisions rationale.\n- Preserve unknowns — never replace with assumptions.\n- No ad copy, headlines, or deliverables.\n- No generic marketing advice.",
      "",
      "JSON schema:",
      strategyJsonSchemaInstruction(),
    ].join("\n");

    return { systemPrompt, userPrompt };
  }
}

export const strategyPromptBuilder = new StrategyPromptBuilder();
