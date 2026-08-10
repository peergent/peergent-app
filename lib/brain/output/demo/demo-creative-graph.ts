import type { CreativeGraph } from "@/lib/brain/layers/creative/types";
import { CREATIVE_LAYER_VERSION } from "@/lib/brain/layers/creative/types";

/** Rich demo CreativeGraph — executive-quality intelligence for PX-35.1. */
export function buildDemoCreativeGraph(input: {
  organizationId: string;
  campaignId: string;
  nl: boolean;
  now?: string;
}): CreativeGraph {
  const nl = input.nl;
  const at = input.now ?? new Date().toISOString();

  return {
    version: CREATIVE_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    createdAt: at,
    phases: [
      {
        phase: "understand_business",
        completedAt: at,
        summary: nl
          ? "Bedrijfsrealiteit en waardepropositie begrepen."
          : "Business reality and value proposition understood.",
        confidence: "high",
        insightCount: 2,
      },
      {
        phase: "understand_audience",
        completedAt: at,
        summary: nl ? "Doelgroep en koopmotivatie in kaart gebracht." : "Audience and buying motivation mapped.",
        confidence: "high",
        insightCount: 2,
      },
      {
        phase: "find_positioning",
        completedAt: at,
        summary: nl
          ? "Zwakke positionering gedetecteerd — sterkere hoek gekozen."
          : "Weak positioning detected — stronger angle selected.",
        confidence: "high",
        insightCount: 3,
      },
      {
        phase: "generate_campaign_concepts",
        completedAt: at,
        summary: nl ? "4 concepten gegenereerd — 1 geselecteerd." : "4 concepts generated — 1 selected.",
        confidence: "high",
        insightCount: 4,
      },
      {
        phase: "generate_messaging",
        completedAt: at,
        summary: nl ? "Messaging framework opgebouwd." : "Messaging framework built.",
        confidence: "high",
        insightCount: 1,
      },
      {
        phase: "generate_channel_strategy",
        completedAt: at,
        summary: nl ? "Google Ads en LinkedIn strategisch toegewezen." : "Google Ads and LinkedIn strategically assigned.",
        confidence: "medium",
        insightCount: 2,
      },
      {
        phase: "generate_deliverables",
        completedAt: at,
        summary: nl ? "3 deliverable-specificaties klaar voor review." : "3 deliverable specs ready for review.",
        confidence: "high",
        insightCount: 3,
      },
    ],
    direction: {
      id: "dir-demo",
      name: nl ? "Operational Freedom" : "Operational Freedom",
      angle: nl
        ? "Expertise en zekerheid — niet prijs"
        : "Expertise and certainty — not price",
      emotion: nl ? "Vertrouwen en controle" : "Trust and control",
      rationale: nl
        ? "Drie concurrenten concurreren nu primair op prijs. Emma positioneerde bewust rond expertise."
        : "Three competitors now compete primarily on price. Emma deliberately positioned around expertise.",
      selected: true,
    },
    campaigns: [
      {
        id: "camp-selected",
        name: "Operational Freedom",
        objective: nl ? "Gekwalificeerde demo-aanvragen" : "Qualified demo requests",
        targetAudience: nl ? "MKB-eigenaren" : "SMB owners",
        keyMessage: nl
          ? "Operational freedom without hiring overhead"
          : "Operational freedom without hiring overhead",
        emotionalTrigger: nl ? "Controle en rust" : "Control and calm",
        businessValue: nl
          ? "Vermijdt prijsconcurrentie door expertise te benadrukken"
          : "Avoids price competition by emphasizing expertise",
        estimatedImpact: nl
          ? "+18% gekwalificeerde leads binnen 30 dagen"
          : "+18% qualified leads within 30 days",
        confidence: "high",
        selected: true,
      },
    ],
    messaging: [
      {
        id: "msg-demo",
        campaignId: "camp-selected",
        headline: nl ? "Operational freedom without hiring overhead" : "Operational freedom without hiring overhead",
        supportingMessage: nl
          ? "Peergent geeft MKB-eigenaren controle zonder extra headcount."
          : "Peergent gives SMB owners control without extra headcount.",
        cta: nl ? "Plan een gesprek" : "Book a conversation",
        proof: [
          nl ? "Snelle time-to-value voor MKB" : "Fast time-to-value for SMBs",
          nl ? "Concreet bewijs uit research" : "Concrete evidence from research",
        ],
        objections: [
          {
            objection: nl ? "Te duur" : "Too expensive",
            response: nl ? "Focus op ROI en time-to-value." : "Focus on ROI and time-to-value.",
          },
        ],
        trustBuilders: [nl ? "Research-gedreven positionering" : "Research-driven positioning"],
      },
    ],
    channelPlans: [
      {
        channel: "google_ads",
        why: nl
          ? "Koopintentie is 24% hoger dan LinkedIn-verkeer in deze markt."
          : "Purchase intent is 24% higher than LinkedIn traffic in this market.",
        goal: nl ? "Demo-aanvragen met hoge intent" : "High-intent demo requests",
        audience: nl ? "MKB-eigenaren die actief zoeken" : "SMB owners actively searching",
        priority: "critical",
        organic: false,
        paid: true,
      },
      {
        channel: "linkedin",
        why: nl
          ? "Autoriteit opbouwen vóór sales outreach."
          : "Build authority before sales outreach.",
        goal: nl ? "Vertrouwen vóór demo-aanvraag" : "Trust before demo request",
        audience: nl ? "MKB-eigenaren" : "SMB owners",
        priority: "high",
        organic: true,
        paid: false,
      },
    ],
    deliverables: [
      {
        id: "del-demo-1",
        type: "google_ads_campaign",
        channel: "google_ads",
        headline: nl ? "Operational freedom without hiring overhead" : "Operational freedom without hiring overhead",
        hook: nl ? "Stop met hiring overhead." : "Stop the hiring overhead.",
        bodyOutline: nl ? "Problem → expertise → demo CTA" : "Problem → expertise → demo CTA",
        cta: nl ? "Plan een gesprek" : "Book a conversation",
        headlineVariations: ["Operational freedom", "Why now?"],
        ctaVariations: [nl ? "Meer weten" : "Learn more"],
        hookVariations: [nl ? "Herken je dit?" : "Sound familiar?"],
        rationale: nl ? "Vangt koopintentie op Google." : "Captures purchase intent on Google.",
        reviewStatus: "planned",
      },
      {
        id: "del-demo-2",
        type: "linkedin_post",
        channel: "linkedin",
        headline: nl ? "Operational freedom" : "Operational freedom",
        hook: nl ? "De meeste teams missen dit." : "Most teams miss this.",
        bodyOutline: nl ? "Thought leadership → trust → demo" : "Thought leadership → trust → demo",
        cta: nl ? "Plan een gesprek" : "Book a conversation",
        headlineVariations: ["Operational freedom"],
        ctaVariations: [nl ? "Meer weten" : "Learn more"],
        hookVariations: [nl ? "Eén beslissing verandert het tempo." : "One decision changes the pace."],
        rationale: nl ? "Autoriteit vóór outreach." : "Authority before outreach.",
        reviewStatus: "planned",
      },
      {
        id: "del-demo-3",
        type: "landing_page",
        channel: "landing_page",
        headline: nl ? "Operational freedom without hiring overhead" : "Operational freedom without hiring overhead",
        hook: nl ? "Waarom nu?" : "Why now?",
        bodyOutline: nl ? "Value prop → proof → demo form" : "Value prop → proof → demo form",
        cta: nl ? "Plan een demo" : "Book a demo",
        headlineVariations: ["Operational freedom"],
        ctaVariations: [nl ? "Start vandaag" : "Start today"],
        hookVariations: [nl ? "Herken je dit?" : "Sound familiar?"],
        rationale: nl ? "Converteert intent naar demo." : "Converts intent to demo.",
        reviewStatus: "planned",
      },
    ],
    decisions: [
      {
        id: "cre-dec-demo",
        title: nl ? "Operational Freedom geselecteerd" : "Operational Freedom selected",
        summary: nl
          ? "Sterkste hoek na positionering en audience-analyse."
          : "Strongest angle after positioning and audience analysis.",
        reason: nl
          ? "Vermijdt prijsconcurrentie en benadrukt expertise."
          : "Avoids price competition and emphasizes expertise.",
        whyNow: nl ? "Planning en strategie zijn gereed." : "Planning and strategy are ready.",
        businessImpact: nl ? "+18% gekwalificeerde leads" : "+18% qualified leads",
        confidence: "high",
        selectedDirection: "Operational Freedom",
        discardedAlternatives: [
          {
            alternative: nl ? "Prijs-leiderschap" : "Price leadership",
            reason: nl ? "Trekt verkeerde doelgroep aan." : "Attracts wrong audience.",
          },
        ],
      },
    ],
    discardedIdeas: [
      {
        idea: nl ? "Prijs-leiderschap campagne" : "Price leadership campaign",
        reason: nl ? "Concurrenten domineren al op prijs." : "Competitors already dominate on price.",
        phase: "generate_campaign_concepts",
      },
      {
        idea: nl ? "Generieke feature-lijst" : "Generic feature list",
        reason: nl ? "Geen emotionele trigger." : "No emotional trigger.",
        phase: "find_positioning",
      },
    ],
    reasoning: [
      {
        step: nl ? "Concurrentie-analyse" : "Competition analysis",
        insight: nl ? "Drie concurrenten concurreren op prijs." : "Three competitors compete on price.",
        phase: "find_positioning",
      },
    ],
    confidence: "high",
    estimatedBusinessImpact: nl ? "+18% gekwalificeerde leads binnen 30 dagen" : "+18% qualified leads within 30 days",
  };
}
