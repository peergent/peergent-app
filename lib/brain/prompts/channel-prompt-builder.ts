import type { ChannelPlanningProjectedContext } from "./projected-context";
import { channelPlanningJsonSchemaInstruction } from "../llm/json-schema";

export type ChannelPromptBundle = {
  systemPrompt: string;
  userPrompt: string;
};

const CHANNEL_IDS = [
  "linkedin",
  "google_ads",
  "email",
  "newsletter",
  "landing_page",
  "blog",
  "instagram",
  "meta_ads",
  "seo",
] as const;

export class ChannelPromptBuilder {
  build(input: { context: ChannelPlanningProjectedContext; locale: "nl" | "en" }): ChannelPromptBundle {
    const nl = input.locale === "nl";

    const systemPrompt = nl
      ? `Je bent Emma, senior marketingstrateeg bij Peergent. Je selecteert en onderbouwt campagnekanalen op basis van een goedgekeurde strategie. Professioneel, praktisch, evidence-driven. Noem nooit AI. Geen excuses. Geen markdown. Antwoord uitsluitend met strict JSON volgens het schema.`
      : `You are Emma, a senior marketing strategist inside Peergent. You select and justify campaign channels based on an approved strategy. Professional, practical, evidence-driven. Never mention AI. No apologies. No markdown. Respond only with strict JSON matching the schema.`;

    const userPrompt = [
      nl ? "Maak een kanaalplan op basis van onderstaande strategie en context." : "Build a channel plan from the strategy and context below.",
      "",
      nl ? "Strategie samenvatting:" : "Strategy summary:",
      input.context.strategySummary,
      "",
      nl ? "Kanaalhypothese uit strategie:" : "Channel hypothesis from strategy:",
      input.context.channelHypothesis,
      "",
      nl ? "Campagnedoel:" : "Campaign goal:",
      input.context.campaignGoal,
      "",
      nl ? "Doelgroep:" : "Target audience:",
      input.context.targetAudience,
      "",
      nl ? "Uitvoeringsmodus:" : "Execution mode:",
      input.context.executionMode,
      "",
      nl ? "Handmatig geselecteerde kanalen (constraints):" : "Manually selected channels (constraints):",
      input.context.manualChannels,
      "",
      nl ? "Vereiste kanalen (één bevinding per kanaal, label formaat 'Channel: {id}'):" : "Required channels (one finding per channel, label format 'Channel: {id}'):",
      CHANNEL_IDS.join(", "),
      "",
      nl ? "Regels:" : "Rules:",
      nl
        ? "- Respecteer handmatige kanaalkeuzes als harde constraints.\n- Gebruik alleen feiten uit strategie en context.\n- Geen performance claims of percentages.\n- Markeer onzekerheid in waarschuwingen."
        : "- Respect manual channel selections as hard constraints.\n- Use only facts from strategy and context.\n- No performance claims or percentages.\n- Mark uncertainty in warnings.",
      "",
      "JSON schema:",
      channelPlanningJsonSchemaInstruction(),
    ].join("\n");

    return { systemPrompt, userPrompt };
  }
}

export const channelPromptBuilder = new ChannelPromptBuilder();
