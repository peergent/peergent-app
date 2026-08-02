import type { CampaignContext } from "./campaign-context";
import type { CampaignEvidenceSection } from "./workflow-types";
import { channelRationaleFor, generateSimulatedCopy, resolveDeliverableChannelsFromMode } from "./generate-campaign-simulation";

const PLACEHOLDER_GOALS = new Set([
  "aangepast doel",
  "custom goal",
  "generate leads",
  "leads genereren",
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isPlaceholder(text: string): boolean {
  const n = normalize(text);
  if (!n || n.length < 4) return true;
  if (PLACEHOLDER_GOALS.has(n)) return true;
  if (/^gericht op (je )?doelgroep\.?$/.test(n)) return true;
  return false;
}

function dedupeSections(sections: CampaignEvidenceSection[]): CampaignEvidenceSection[] {
  const seen = new Set<string>();
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const key = normalize(item);
        if (!key || isPlaceholder(item)) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}

function mentionsAiWorkforce(text: string): boolean {
  return /ai[- ]?colleg|digitale colleg|ai colleague|team capaciteit|tijd besparen|time sav/i.test(text);
}

function buildGoalItems(ctx: CampaignContext, nl: boolean): string[] {
  const items: string[] = [];
  for (const goal of ctx.goals) {
    if (isPlaceholder(goal)) continue;
    items.push(goal);
  }
  if (ctx.description.trim() && !isPlaceholder(ctx.description)) {
    const desc = ctx.description.trim();
    if (nl && /demo|lead|aanvr/i.test(desc)) {
      items.push(`Meer relevante demo-aanvragen genereren voor ${ctx.companyName}.`);
    } else if (/demo|lead/i.test(desc)) {
      items.push(`Generate more relevant demo requests for ${ctx.companyName}.`);
    } else if (items.length === 0) {
      items.push(desc);
    }
  }
  return items.slice(0, 3);
}


function buildPositioning(ctx: CampaignContext, nl: boolean): string {
  const combined = `${ctx.description} ${ctx.audience}`;
  if (mentionsAiWorkforce(combined)) {
    return nl
      ? `${ctx.companyName} levert digitale collega's die naast het bestaande team werken en concrete taken overnemen.`
      : `${ctx.companyName} provides digital colleagues that work alongside existing teams and take on concrete tasks.`;
  }
  if (ctx.description.trim()) {
    return nl
      ? `${ctx.companyName} positioneert zich rond: ${ctx.description.slice(0, 140)}`
      : `${ctx.companyName} positions itself around: ${ctx.description.slice(0, 140)}`;
  }
  return nl
    ? `${ctx.companyName} moet nog scherper worden gepositioneerd op basis van aanvullende input.`
    : `${ctx.companyName} needs sharper positioning from additional input.`;
}

function buildCoreMessage(ctx: CampaignContext, nl: boolean): string {
  const copy = generateSimulatedCopy(ctx);
  const firstLine = copy.linkedinBody.split("\n")[0]?.trim();
  if (firstLine && !normalize(firstLine).includes(normalize(copy.objective))) {
    return firstLine;
  }
  if (mentionsAiWorkforce(`${ctx.description} ${ctx.audience}`)) {
    return nl
      ? "Vergroot de capaciteit van je team zonder direct extra personeel aan te nemen."
      : "Expand your team's capacity without hiring immediately.";
  }
  if (ctx.goals[0] && !isPlaceholder(ctx.goals[0])) {
    return nl
      ? `De boodschap die blijft hangen: ${ctx.companyName} helpt bij ${ctx.goals[0].toLowerCase()}.`
      : `The message to remember: ${ctx.companyName} helps with ${ctx.goals[0].toLowerCase()}.`;
  }
  return copy.objective.split("—")[0]?.trim() ?? copy.objective;
}

function buildApproach(ctx: CampaignContext, nl: boolean): string {
  const wantsDemo = /demo|lead|aanvr/i.test(`${ctx.goals.join(" ")} ${ctx.description}`);
  if (wantsDemo) {
    return nl
      ? "Bouw eerst herkenning en vertrouwen op en stuur geïnteresseerden vervolgens naar een concrete demo-aanvraag."
      : "Build recognition and trust first, then drive interested prospects to a concrete demo request.";
  }
  if (ctx.description.trim()) {
    return nl
      ? `Start met relevante content voor ${ctx.audience || "de doelgroep"}, gevolgd door een duidelijke vervolgstap.`
      : `Start with relevant content for ${ctx.audience || "the audience"}, followed by a clear next step.`;
  }
  return nl
    ? "Eerst context verdiepen, daarna gerichte content en een heldere call-to-action."
    : "Deepen context first, then targeted content and a clear call to action.";
}

function buildChannelPreview(ctx: CampaignContext, nl: boolean): string[] {
  const copy = generateSimulatedCopy(ctx);
  const channels = resolveDeliverableChannelsFromMode(ctx).slice(0, 4);
  return channels.map((ch) => {
    const rationale = channelRationaleFor(ctx, ch, copy);
    const label =
      ch === "linkedin"
        ? "LinkedIn"
        : ch === "email"
          ? nl
            ? "E-mail"
            : "Email"
          : ch === "google_ads"
            ? "Google Ads"
            : ch === "website_landing"
              ? nl
                ? "Landingspagina"
                : "Landing page"
              : ch;
    return `${label}: ${rationale}`;
  });
}

function buildCta(ctx: CampaignContext, nl: boolean): string {
  const wantsDemo = /demo|lead|aanvr/i.test(`${ctx.goals.join(" ")} ${ctx.description}`);
  if (wantsDemo) return nl ? "Demo aanvragen" : "Request a demo";
  if (/offerte|quote|proposal/i.test(ctx.description)) return nl ? "Offerte aanvragen" : "Request a quote";
  return nl ? "Meer informatie" : "Learn more";
}

function buildKpis(ctx: CampaignContext, nl: boolean): string[] {
  const items: string[] = [];
  if (/demo|lead|aanvr/i.test(`${ctx.goals.join(" ")} ${ctx.description}`)) {
    items.push(nl ? "Aantal demo-aanvragen" : "Demo requests");
    items.push(nl ? "Kwaliteit van leads (fit met doelgroep)" : "Lead quality (audience fit)");
  }
  if (/linkedin/i.test(resolveDeliverableChannelsFromMode(ctx).join(" "))) {
    items.push(nl ? "Bereik en engagement op LinkedIn" : "LinkedIn reach and engagement");
  }
  if (/email|newsletter/i.test(resolveDeliverableChannelsFromMode(ctx).join(" "))) {
    items.push(nl ? "Open rate en klikken op e-mail" : "Email open rate and clicks");
  }
  return items;
}

function buildAssumptions(ctx: CampaignContext, nl: boolean): string[] {
  const items: string[] = [];
  if (ctx.websiteState === "simulated_analysis_complete" && ctx.websiteUrl) {
    items.push(
      nl
        ? `Je hebt ${ctx.websiteUrl} opgegeven — er is geen echte websitecrawl uitgevoerd; strategie baseert op campagne-input.`
        : `You supplied ${ctx.websiteUrl} — no real website crawl was performed; strategy uses campaign input.`
    );
  }
  if (ctx.competitorsSkipped) {
    items.push(nl ? "Concurrentieanalyse is overgeslagen." : "Competitor analysis was skipped.");
  } else if (ctx.competitors.length === 0 && ctx.competitorContextState === "missing") {
    items.push(nl ? "Geen concurrenten opgegeven — differentiatie is nog beperkt." : "No competitors supplied — differentiation is limited.");
  }
  if (!ctx.audience.trim()) {
    items.push(nl ? "Doelgroep is nog niet scherp genoeg beschreven." : "Audience is not yet described sharply enough.");
  }
  return items;
}

function buildBusinessSummary(ctx: CampaignContext, nl: boolean): string {
  const parts: string[] = [];
  if (ctx.companyName) {
    parts.push(
      nl
        ? `${ctx.companyName} wil ${ctx.goals[0]?.toLowerCase() || "groei realiseren"} bij ${ctx.audience || "de doelgroep"}.`
        : `${ctx.companyName} aims to ${ctx.goals[0]?.toLowerCase() || "drive growth"} with ${ctx.audience || "the target audience"}.`
    );
  }
  if (ctx.description.trim()) {
    parts.push(
      nl
        ? `Kern van het aanbod: ${ctx.description.slice(0, 160)}`
        : `Core offer: ${ctx.description.slice(0, 160)}`
    );
  }
  return parts.join(" ") || (nl ? "Nog onvoldoende bedrijfscontext." : "Insufficient company context.");
}

function buildValueProposition(ctx: CampaignContext, nl: boolean): string {
  if (mentionsAiWorkforce(`${ctx.description} ${ctx.audience}`)) {
    return nl
      ? "Digitale collega's die naast je team werken — meer capaciteit zonder directe extra headcount."
      : "Digital colleagues working alongside your team — more capacity without immediate headcount.";
  }
  if (ctx.description.trim()) {
    return nl
      ? `Concreet voordeel voor ${ctx.audience || "de doelgroep"}: ${ctx.description.slice(0, 120)}`
      : `Concrete benefit for ${ctx.audience || "the audience"}: ${ctx.description.slice(0, 120)}`;
  }
  return nl
    ? "Waardepropositie moet nog worden aangescherpt op basis van aanvullende input."
    : "Value proposition needs sharpening from additional input.";
}

function buildPainPoints(ctx: CampaignContext, nl: boolean): string[] {
  const items: string[] = [];
  const combined = `${ctx.description} ${ctx.audience}`.toLowerCase();
  if (mentionsAiWorkforce(combined)) {
    items.push(
      nl ? "Terugkerend werk vreet tijd van het kernteam." : "Recurring work eats core team time.",
      nl ? "Uitbreiden met personeel is duur en traag." : "Hiring is expensive and slow.",
      nl ? "Kleine teams missen capaciteit voor groei-initiatieven." : "Small teams lack capacity for growth initiatives."
    );
  } else if (/tijd|time|effici/i.test(combined)) {
    items.push(
      nl ? "Te veel tijd aan operationeel werk." : "Too much time on operational work.",
      nl ? "Weinig ruimte voor strategische prioriteiten." : "Little room for strategic priorities."
    );
  } else if (ctx.description.trim()) {
    items.push(ctx.description.slice(0, 140));
  }
  return items.slice(0, 3);
}

function buildCustomerJourney(ctx: CampaignContext, nl: boolean): string[] {
  const wantsDemo = /demo|lead|aanvr/i.test(`${ctx.goals.join(" ")} ${ctx.description}`);
  if (wantsDemo) {
    return nl
      ? [
          "Herkenning — doelgroep ziet relevante content op LinkedIn.",
          "Interesse — e-mail of landingspagina met diepere uitleg.",
          "Actie — demo-aanvraag of gesprek met sales.",
        ]
      : [
          "Awareness — audience sees relevant content on LinkedIn.",
          "Interest — email or landing page with deeper explanation.",
          "Action — demo request or sales conversation.",
        ];
  }
  return nl
    ? [
        "Bereik — eerste contact via gekozen kanalen.",
        "Overweging — verdieping via content en follow-up.",
        "Conversie — duidelijke call-to-action.",
      ]
    : [
        "Reach — first contact via chosen channels.",
        "Consideration — depth via content and follow-up.",
        "Conversion — clear call to action.",
      ];
}

function buildContentDirection(ctx: CampaignContext, nl: boolean): string[] {
  const copy = generateSimulatedCopy(ctx);
  const items: string[] = [];
  const channels = resolveDeliverableChannelsFromMode(ctx);
  if (channels.includes("linkedin")) {
    items.push(
      nl
        ? "LinkedIn: thought leadership en herkenbare situaties voor de doelgroep."
        : "LinkedIn: thought leadership and relatable situations for the audience."
    );
  }
  if (channels.includes("email")) {
    items.push(
      nl
        ? "E-mail: persoonlijke follow-up met concrete vervolgstap."
        : "Email: personal follow-up with a concrete next step."
    );
  }
  if (channels.includes("google_ads")) {
    items.push(
      nl
        ? "Google Ads: zoekintentie opvangen met heldere propositie."
        : "Google Ads: capture search intent with a clear proposition."
    );
  }
  if (channels.includes("website_landing")) {
    items.push(
      nl
        ? "Landingspagina: conversiegerichte pagina met social proof."
        : "Landing page: conversion-focused page with social proof."
    );
  }
  if (items.length === 0) {
    items.push(
      nl
        ? `Content sluit aan op: ${copy.objective.slice(0, 100)}`
        : `Content aligns with: ${copy.objective.slice(0, 100)}`
    );
  }
  return items;
}

function buildRisks(ctx: CampaignContext, nl: boolean): string[] {
  const items: string[] = [];
  if (ctx.competitorsSkipped || ctx.competitors.length === 0) {
    items.push(
      nl
        ? "Beperkte concurrentie-inzichten — differentiatie kan zwakker overkomen."
        : "Limited competitor insight — differentiation may feel weaker."
    );
  }
  if (ctx.websiteState === "missing" || ctx.websiteState === "skipped") {
    items.push(
      nl
        ? "Geen websitecontext — tone of voice moet uit campagne-input komen."
        : "No website context — tone of voice must come from campaign input."
    );
  }
  if (!ctx.audience.trim()) {
    items.push(
      nl ? "Onduidelijke doelgroep kan bereik versnipperen." : "Unclear audience may scatter reach."
    );
  }
  items.push(
    nl
      ? "Te vroege hard-sell kan vertrouwen ondermijnen bij koude doelgroep."
      : "Early hard-sell can undermine trust with cold audiences."
  );
  return items.slice(0, 3);
}

function buildNextRecommendation(ctx: CampaignContext, nl: boolean): string {
  if (ctx.websiteState === "missing") {
    return nl
      ? "Voeg je website toe zodat ik tone of voice en positionering kan verfijnen — of ga door met campagne-input."
      : "Add your website so I can refine tone and positioning — or continue with campaign input.";
  }
  const wantsDemo = /demo|lead|aanvr/i.test(`${ctx.goals.join(" ")} ${ctx.description}`);
  if (wantsDemo) {
    return nl
      ? "Keur de strategie goed, daarna stel ik kanalen voor en maak ik LinkedIn-, e-mail- en landingspagina-onderdelen."
      : "Approve the strategy, then I'll propose channels and create LinkedIn, email, and landing page deliverables.";
  }
  return nl
    ? "Keur de strategie goed — daarna kies ik kanalen en maak ik de campagneonderdelen."
    : "Approve the strategy — then I'll choose channels and create deliverables.";
}

function buildAlternatives(ctx: CampaignContext, nl: boolean): string[] {
  const wantsDemo = /demo|lead|aanvr/i.test(`${ctx.goals.join(" ")} ${ctx.description}`);
  if (wantsDemo) {
    return [
      nl
        ? "Directe cold outreach zonder warme content — afgewezen: te weinig vertrouwen bij koude doelgroep."
        : "Direct cold outreach without warm content — rejected: insufficient trust with cold audience.",
      nl
        ? "Brede naamsbekendheidscampagne zonder conversiepad — afgewezen: past niet bij demo-doel."
        : "Broad awareness without conversion path — rejected: doesn't fit demo goal.",
    ];
  }
  return [
    nl
      ? "Alleen organische posts zonder follow-up — afgewezen: te weinig structuur voor meetbaar resultaat."
      : "Organic posts only without follow-up — rejected: too little structure for measurable results.",
  ];
}

export function buildStructuredStrategyEvidence(
  ctx: CampaignContext,
  nl: boolean
): { title: string; intro: string; sections: readonly CampaignEvidenceSection[] } {
  const sections: CampaignEvidenceSection[] = [];

  sections.push({
    id: "business_summary",
    title: nl ? "Bedrijfssamenvatting" : "Business summary",
    items: [buildBusinessSummary(ctx, nl)],
  });

  const goals = buildGoalItems(ctx, nl);
  if (goals.length) {
    sections.push({ id: "campaign_goals", title: nl ? "Campagnedoel" : "Campaign goal", items: goals });
  }

  if (ctx.audience.trim()) {
    sections.push({
      id: "target_audience",
      title: nl ? "Doelgroep" : "Target audience",
      items: [ctx.audience.trim()],
    });
  }

  const painPoints = buildPainPoints(ctx, nl);
  if (painPoints.length) {
    sections.push({
      id: "pain_points",
      title: nl ? "Pijnpunten" : "Pain points",
      items: painPoints,
    });
  }

  sections.push({
    id: "positioning",
    title: nl ? "Positionering" : "Positioning",
    items: [buildPositioning(ctx, nl)],
  });

  sections.push({
    id: "value_proposition",
    title: nl ? "Waardepropositie" : "Value proposition",
    items: [buildValueProposition(ctx, nl)],
  });

  sections.push({
    id: "core_message",
    title: nl ? "Kernboodschap" : "Core message",
    items: [buildCoreMessage(ctx, nl)],
  });

  sections.push({
    id: "customer_journey",
    title: nl ? "Customer journey" : "Customer journey",
    items: buildCustomerJourney(ctx, nl),
  });

  sections.push({
    id: "content_direction",
    title: nl ? "Contentrichting" : "Content direction",
    items: buildContentDirection(ctx, nl),
  });

  const channelItems = buildChannelPreview(ctx, nl);
  if (channelItems.length) {
    sections.push({
      id: "channel_direction",
      title: nl ? "Kanaalrichting" : "Channel direction",
      items: channelItems,
    });
  }

  sections.push({
    id: "approach",
    title: nl ? "Aanpak" : "Approach",
    items: [buildApproach(ctx, nl)],
  });

  sections.push({
    id: "cta",
    title: "CTA",
    items: [buildCta(ctx, nl)],
  });

  const kpis = buildKpis(ctx, nl);
  if (kpis.length) {
    sections.push({ id: "kpis", title: "KPI's", items: kpis });
  }

  sections.push({
    id: "risks",
    title: nl ? "Risico's" : "Risks",
    items: buildRisks(ctx, nl),
  });

  const assumptions = buildAssumptions(ctx, nl);
  if (assumptions.length) {
    sections.push({
      id: "assumptions",
      title: nl ? "Aannames" : "Assumptions",
      items: assumptions,
    });
  }

  sections.push({
    id: "alternatives",
    title: nl ? "Alternatieven (niet gekozen)" : "Alternatives (not chosen)",
    items: buildAlternatives(ctx, nl),
  });

  sections.push({
    id: "next_recommendation",
    title: nl ? "Volgende aanbeveling" : "Next recommendation",
    items: [buildNextRecommendation(ctx, nl)],
  });

  return {
    title: nl ? "Strategie" : "Strategy",
    intro: nl
      ? "Dit is mijn marketingvoorstel op basis van wat je hebt ingevuld. Elke sectie heeft een eigen rol — geen herhaling, wel een helder plan."
      : "This is my marketing proposal based on what you provided. Each section has its own role — no repetition, a clear plan.",
    sections: dedupeSections(sections),
  };
}

export const EMMA_PLAN_STEPS_NL = [
  "Je bedrijf begrijpen",
  "Website bekijken",
  "Markt en concurrenten onderzoeken",
  "Strategie voorstellen",
  "Kanalen kiezen",
  "Campagneonderdelen maken",
  "Alles klaarzetten",
] as const;

export const EMMA_PLAN_STEPS_EN = [
  "Understand your business",
  "Review your website",
  "Research market and competitors",
  "Propose strategy",
  "Choose channels",
  "Create campaign deliverables",
  "Prepare everything",
] as const;

export const EMMA_OPENING_NL = "Ik ga deze campagne voor je opbouwen.";
export const EMMA_OPENING_EN = "I'm going to build this campaign for you.";
