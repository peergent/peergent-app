/**
 * The Demo Workspace — one coherent fictional company.
 *
 * ## Why this is a single domain input
 *
 * Every Office destination is built by a pure adapter over one
 * `MarketingPeerDomainInput`. Authoring the demo at that layer — rather than
 * writing six page fixtures — means consistency is *structural* rather than
 * maintained by hand:
 *
 * - a campaign shown in Work exists in Content because the same work unit
 *   carries both `projectId` and `draftId`;
 * - published content moves Performance because Performance counts published
 *   drafts and draws its trend from their dates;
 * - the by-campaign cut on Performance resolves through the same attribution
 *   helper the Content page uses;
 * - Market's competitor claims are the evidence the campaign goals quote.
 *
 * It is impossible for these to drift, because nothing here is stated twice.
 * The demo also passes through the *same* grounding gates as live data: if the
 * connections below were removed, Performance would refuse to show channel
 * metrics exactly as it does for a real customer.
 *
 * ## What this is not
 *
 * This is not seeded production data and it never reaches a repository. It is a
 * curated showcase, rendered read-only, behind a peer id that no real workspace
 * can hold. The UI labels it as a demo wherever it appears.
 *
 * ## The company
 *
 * Veldwerk sells scheduling software to installation companies — solar and
 * heat-pump installers running ten to fifty engineers. Its wedge is onboarding
 * speed: the incumbents take months to set up, and none of them market against
 * that. Every campaign, every piece of content and every recommendation in this
 * workspace traces back to that single observation, which is what makes the
 * demo read as one company rather than a pile of plausible rows.
 */

import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  MarketingContentDraft,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { IntegrationConnection } from "@/lib/integrations/types";
import type { MetricSnapshot } from "@/lib/metrics/types";
import type { ActivityFeedItem } from "@/lib/marketing-workspace";

/** The peer id the demo lives behind. No real workspace may use it. */
export const DEMO_PEER_ID = "demo";
export const DEMO_PEER_NAME = "Emma";
export const DEMO_PEER_ROLE = "Marketing";
export const DEMO_COMPANY_NAME = "Veldwerk";

export function isDemoPeer(peerId: string | null | undefined): boolean {
  return peerId === DEMO_PEER_ID;
}

/* ---------------- Time -----------------------------------------------------
 * Dates are always relative to `now`, so the demo never looks abandoned. Tests
 * pass a fixed `now` to keep assertions deterministic.
 * -------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

function iso(now: Date, offsetDays: number, hour = 9): string {
  const date = new Date(now.getTime() + offsetDays * DAY_MS);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

/* ---------------- What she knows ------------------------------------------ */

function understanding(now: Date, locale: DemoLocale): MarketingUnderstanding {
  const nl = locale === "nl";

  return {
    available: true,
    sparse: false,
    completeness: 0.86,
    // Deliberately not empty: a real workspace always has something missing,
    // and the product's honesty about that is part of what the demo shows.
    gaps: ["existingContent"],
    brand: {
      mission: nl
        ? "Een installatieploeg fatsoenlijk ingepland krijgen, zonder implementatietraject van een kwartaal."
        : "Get an installation team planned properly, without a three-month implementation.",
      values: [
        { id: "v1", name: nl ? "Gewone taal" : "Plain language", priority: 1 },
        {
          id: "v2",
          name: nl ? "Respect voor de dag van de monteur" : "Respect for the engineer's day",
          priority: 2,
        },
      ],
      toneOfVoice: {
        summary: nl
          ? "Direct en praktisch, geen jargon. Praat met eigenaren, niet met IT."
          : "Direct, practical, no jargon. Talks to owners, not to IT.",
        personality: nl
          ? ["Recht door zee", "Rustig", "Concreet"]
          : ["Straightforward", "Calm", "Concrete"],
        dos: nl
          ? ["Noem echte cijfers", "Benoem het probleem gewoon"]
          : ["Use real numbers", "Name the problem plainly"],
        donts: nl ? ["Buzzwords", "Corporate taal"] : ["Buzzwords", "Enterprise-speak"],
      },
      positioningStatement: nl
        ? "Veldwerk krijgt een installatieploeg in een week ingepland, niet in een kwartaal."
        : "Veldwerk gets an installation team planned in a week, not a quarter.",
      tagline: nl ? "In een week live." : "Planned in a week.",
      valueProposition: nl
        ? "Planning gebouwd voor installatiebedrijven met 10 tot 50 monteurs, live in vijf werkdagen."
        : "Scheduling built for installation companies of 10–50 engineers, live in five working days.",
      keyMessages: nl
        ? [
            "Live in vijf werkdagen",
            "Gebouwd voor de dag van de monteur, niet voor de backoffice",
            "Nederlandse support, Nederlandse facturatie",
          ]
        : [
            "Live in five working days",
            "Built for the engineer's day, not the back office",
            "Dutch support, Dutch invoicing",
          ],
      marketCategory: nl ? "Planning voor buitendienst" : "Field service scheduling",
    },
    products: [
      {
        id: "prod-planner",
        name: "Veldwerk Planner",
        description: nl
          ? "Slepen en neerzetten, met reistijd die vanzelf klopt."
          : "Drag-and-drop scheduling with automatic travel time.",
        category: nl ? "Software" : "Software",
      },
      {
        id: "prod-mobile",
        name: "Veldwerk Mobiel",
        description: nl
          ? "Werkbon-app voor de monteur, werkt ook zonder bereik."
          : "Offline-capable job app for engineers in the field.",
        category: "Software",
      },
    ],
    services: [
      {
        id: "svc-onboarding",
        name: nl ? "Inrichting in vijf dagen" : "Five-day onboarding",
        description: nl
          ? "Data overzetten, planning inrichten en monteurs opleiden in één week."
          : "Data import, schedule setup and engineer training in one week.",
        category: nl ? "Dienst" : "Service",
      },
    ],
    customerSegments: [
      {
        id: "seg-owners",
        name: nl ? "Eigenaren van installatiebedrijven" : "Installation company owners",
        description: nl
          ? "Installateurs van zonnepanelen en warmtepompen met 10 tot 50 monteurs."
          : "Solar and heat-pump installers running 10–50 engineers.",
        painPoints: nl
          ? [
              "De planner is elke dag een uur kwijt aan herplannen",
              "Monteurs rijden routes die niemand heeft geoptimaliseerd",
              "Gemiste reactietijden kosten onderhoudscontracten",
            ]
          : [
              "The planner spends an hour a day re-planning around emergencies",
              "Engineers drive routes nobody optimised",
              "Missed SLAs cost service contracts",
            ],
        buyingTriggers: nl
          ? [
              "Doorgroeien voorbij wat één planner aankan",
              "Een onderhoudscontract verliezen op reactietijd",
              "Een mislukte implementatie bij een vorige leverancier",
            ]
          : [
              "Hiring past the point one planner can handle",
              "Losing a maintenance contract over response times",
              "A failed implementation with a previous vendor",
            ],
      },
    ],
    /**
     * The competitive picture that every recommendation in this workspace
     * rests on. Note what is absent: none of the three claims fast onboarding,
     * and two are on record as slow. That shared gap is the argument, and the
     * Market page infers it from these notes rather than being told.
     */
    competitors: [
      {
        id: "comp-routeplan",
        name: "Routeplan",
        strengths: nl
          ? ["Laagste prijs per gebruiker", "Lange staat van dienst bij vloten van 200+ monteurs"]
          : ["Lowest price per seat", "Long track record with 200+ engineer fleets"],
        weaknesses: nl
          ? ["Traag om een ploeg live te krijgen", "Support en documentatie alleen in het Engels"]
          : ["Slow to get a team live", "Support and documentation in English only"],
        differentiators: nl
          ? ["Routeoptimalisatie op grote schaal"]
          : ["Route optimisation at large fleet scale"],
      },
      {
        id: "comp-servicedesk",
        name: "Servicedesk Pro",
        strengths: nl
          ? ["Breedste functieaanbod", "Sterke module voor facturatie en contracten"]
          : ["Broadest feature set", "Strong invoicing and contract module"],
        weaknesses: nl
          ? [
              "Traag om een ploeg live te krijgen",
              "Te zwaar voor ploegen onder de vijftig monteurs",
              "Geen offline modus in de app",
            ]
          : [
              "Slow to get a team live",
              "Too heavy for teams under fifty engineers",
              "No offline mode in the field app",
            ],
        differentiators: nl ? ["Alles-in-één backoffice"] : ["All-in-one back office"],
      },
      {
        id: "comp-fieldly",
        name: "Fieldly",
        strengths: nl
          ? ["Mooiste mobiele app in de categorie"]
          : ["Best-looking mobile app in the category"],
        weaknesses: nl
          ? ["Geen Nederlandse taal of facturatie", "Magere rapportage"]
          : ["No Dutch language or Dutch invoicing", "Reporting is thin"],
        differentiators: nl
          ? ["Mobiel-eerst voor de monteur"]
          : ["Mobile-first for engineers"],
      },
    ],
    goals: [
      {
        id: "goal-demos",
        title: nl ? "40 demo-afspraken per kwartaal" : "40 booked demos per quarter",
        description: nl
          ? "Genoeg pijplijn om twee nieuwe accountmanagers te dragen."
          : "Enough qualified pipeline to support two new account executives.",
        status: "active",
        timeframe: nl ? "Q4" : "Q4",
        priority: 1,
      },
      {
        id: "goal-ttfv",
        title: nl
          ? "Binnen zeven dagen waarde leveren"
          : "Keep time-to-first-value under seven days",
        description: nl
          ? "De belofte over inrichting houdt alleen stand als de levering standhoudt."
          : "The onboarding claim only holds if delivery holds.",
        status: "active",
        timeframe: nl ? "Doorlopend" : "Ongoing",
        priority: 2,
      },
    ],
    existingContent: [],
    assembledAt: iso(now, -2, 8),
  };
}

/* ---------------- Her strategy -------------------------------------------- */

function strategy(now: Date, locale: DemoLocale): MarketingStrategy {
  const nl = locale === "nl";
  const basedOn = ["marketing-understanding" as const, "business-brain" as const];

  return {
    summary: nl
      ? "Claim het argument over snelheid van inrichten. Het is de enige claim die de grote spelers niet kunnen maken, en het is precies het bezwaar waar deals op stranden bij eigenaren die het eerder hebben meegemaakt."
      : "Own the onboarding-speed argument. It is the one claim the category leaders cannot make, and it is the objection that kills deals with owners who have been burned before.",
    confidence: "high",
    confidenceReason: nl
      ? "Gebaseerd op drie vastgelegde concurrenten en een positionering die de klant zelf heeft geschreven."
      : "Grounded in three recorded competitors and a positioning statement the customer wrote themselves.",
    targetAudiences: [
      {
        segment: nl ? "Eigenaren van installatiebedrijven" : "Installation company owners",
        priority: "primary",
        rationale: {
          why: nl
            ? "Zij tekenen, zij voelen de planningspijn dagelijks, en zij dragen de littekens van een mislukte implementatie."
            : "They sign, they feel the planning pain daily, and they carry the scar tissue from a failed implementation.",
          basedOn,
        },
      },
    ],
    positioningRecommendations: [
      {
        recommendation: nl
          ? "Begin elk stuk met de tijd tot live, niet met het aantal functies. Op functies wint Servicedesk Pro; op snelheid winnen wij."
          : "Lead every asset with time-to-live, not feature count. Feature comparisons favour Servicedesk Pro; speed favours us.",
        rationale: {
          why: nl
            ? "Servicedesk Pro wint op breedte en Routeplan op prijs, dus geen van beide assen is te winnen."
            : "Servicedesk Pro wins on breadth and Routeplan wins on price, so neither axis is winnable.",
          basedOn,
        },
      },
    ],
    contentPillars: [
      {
        name: nl ? "Snel live" : "Onboarding speed",
        themes: nl
          ? ["Inrichting in vijf dagen", "Wat er misgaat in trajecten van maanden"]
          : ["Five-day setup", "What goes wrong in month-three implementations"],
        rationale: {
          why: nl
            ? "Twee concurrenten staan vastgelegd als traag om live te gaan, en niemand voert er verweer tegen."
            : "Two competitors are on record as slow to go live, and nobody is arguing against it.",
          basedOn,
        },
      },
      {
        name: nl ? "De dag van de monteur" : "The engineer's day",
        themes: nl
          ? ["Offline op locatie", "Reistijd die niemand had ingepland"]
          : ["Offline in the field", "Travel time nobody planned"],
        rationale: {
          why: nl
            ? "Fieldly heeft de mooiste app, maar zonder Nederlandse support blijft het praktische argument open."
            : "Fieldly owns mobile polish, but its lack of Dutch support leaves the practical argument open.",
          basedOn,
        },
      },
    ],
    campaignIdeas: [
      {
        name: nl ? "In een week live" : "Onboarding in a week",
        objective: nl
          ? "Eigenaren die een mislukte implementatie hebben overleefd een demo laten inplannen."
          : "Get owners who have survived a failed implementation to book a demo.",
        channels: nl ? ["LinkedIn", "Nieuwsbrief"] : ["LinkedIn", "Newsletter"],
        rationale: {
          why: nl
            ? "Het is de enige claim die geen enkele concurrent bestrijdt, en hij beantwoordt het bezwaar waar deals op blijven hangen."
            : "It is the only claim no competitor contests, and it answers the objection that stalls deals.",
          basedOn,
        },
      },
    ],
    seoOpportunities: [
      {
        topic: "planningssoftware installatiebedrijf",
        intent: nl ? "commercieel" : "commercial",
        rationale: {
          why: nl
            ? "Hoge koopintentie, en de grote spelers scoren juist op algemene termen."
            : "High intent, and the incumbents rank on generic field-service terms instead.",
          basedOn,
        },
      },
    ],
    socialMediaStrategy: [
      {
        platform: "LinkedIn",
        approach: nl
          ? "Berichten van ondernemer tot ondernemer over implementaties die misliepen, en waarom."
          : "Owner-to-owner posts about implementations that went wrong, and why.",
        rationale: {
          why: nl
            ? "De doelgroep zit op LinkedIn en luistert naar vakgenoten, niet naar leveranciers."
            : "The audience is on LinkedIn and responds to peers, not to vendors.",
          basedOn,
        },
      },
    ] as MarketingStrategy["socialMediaStrategy"],
    customerJourneyRecommendations: [],
    leadGenerationOpportunities: [],
    marketingPriorities: [],
    knowledgeGaps: nl
      ? ["Nog niet vastgelegd welke bestaande content al presteert"]
      : ["No record of which existing content already performs"],
    generatedAt: iso(now, -30, 10),
  };
}

/* ---------------- Campaigns ------------------------------------------------ */

function projects(
  now: Date,
  peerId: string,
  locale: DemoLocale
): MarketingProject[] {
  const nl = locale === "nl";

  return [
    {
      id: "camp-heatpump",
      peerId,
      title: nl ? "Klaar voor het warmtepompseizoen" : "Heat pump season readiness",
      goal: nl
        ? "Installateurs bereiken vóór de drukte van het najaar begint."
        : "Reach installers before the autumn heat-pump rush starts.",
      campaignType: "content_series",
      createdAt: iso(now, -14, 9),
      updatedAt: iso(now, -1, 11),
      ownerLabel: DEMO_PEER_NAME,
      rawRequest: nl
        ? "Praktische waarde vóór de piek — checklist en LinkedIn voor eigenaren van installatiebedrijven."
        : "Practical value before the rush — checklist and LinkedIn for installation company owners.",
      origin: "recommendation",
      campaignSetup: {
        description: nl
          ? "Emma heeft strategie, kanalen en deliverables voorbereid. Alles wacht op jouw goedkeuring."
          : "Emma prepared strategy, channels, and deliverables. Everything is waiting for your approval.",
        primaryGoalId: "generate_leads",
        secondaryGoalIds: ["brand_awareness"],
        setupMode: "automatic",
        priority: "high",
        approvalMode: "approval_before_publication",
        selectedChannels: ["linkedin", "email", "blog"],
        selectedDeliverables: ["social_post", "email", "blog_article"],
        targetAudience: nl
          ? "Eigenaren van installatiebedrijven (10–50 monteurs)"
          : "Installation company owners (10–50 engineers)",
        startDate: iso(now, -14, 9).slice(0, 10),
        endDate: iso(now, 45, 9).slice(0, 10),
        timingDecision: "dated",
      },
    },
  ];
}

/* ---------------- Content -------------------------------------------------- */

type DraftSeed = {
  id: string;
  ref: string;
  title: Record<DemoLocale, string>;
  body: Record<DemoLocale, string>;
  contentType: MarketingContentDraft["contentType"];
  channel: string;
  status: MarketingContentDraft["status"];
  daysAgo: number;
  objective: Record<DemoLocale, string>;
};

/**
 * Every draft belongs to a campaign through its work unit, and the published
 * ones are dated across the last month so Performance has a real cadence to
 * draw rather than a single point.
 */
const DRAFT_SEEDS: Record<string, DraftSeed[]> = {
  "camp-heatpump": [
    {
      id: "draft-hp-email",
      ref: "heatpump/acq-email",
      title: {
        nl: "Acquisition e-mail — warmtepompseizoen",
        en: "Acquisition email — heat pump season",
      },
      body: {
        nl: "From: Emma @ Veldwerk <emma@veldwerk.nl>\nTo: Eigenaren van installatiebedrijven (10–50 monteurs)\nSubject: Vóór het warmtepompseizoen begint\nPreheader: Zes dingen die je in september al regelt\nCTA: Bekijk de checklist\n---\nHallo,\n\nElk najaar verdubbelt het aantal klussen. De meeste installateurs die ik spreek wachten tot oktober — en dan is het te laat om je planning om te gooien zonder overtime.\n\nIk heb een korte checklist gemaakt met zes dingen die je nú al kunt regelen: van subsidie-doorlooptijden tot wie op zaterdag de spoedmeldingen oppakt.\n\nGroet,\nEmma",
        en: "From: Emma @ Veldwerk <emma@veldwerk.nl>\nTo: Installation company owners (10–50 engineers)\nSubject: Before heat pump season starts\nPreheader: Six things to settle in September\nCTA: View the checklist\n---\nHi,\n\nEvery autumn the job count doubles. Most installers I speak to wait until October — then it is too late to reshuffle the schedule without overtime.\n\nI put together a short checklist of six things you can settle now: from subsidy paperwork lead times to who takes emergency calls on a Saturday.\n\nBest,\nEmma",
      },
      contentType: "newsletter",
      channel: "email",
      status: "ready_for_review",
      daysAgo: 1,
      objective: {
        nl: "Praktische waarde vóór de piek — geen harde verkoop.",
        en: "Practical value before the rush — no hard sell.",
      },
    },
    {
      id: "draft-hp-1",
      ref: "heatpump/li-1",
      title: {
        nl: "Elk najaar dezelfde piek",
        en: "Every autumn the same crunch",
      },
      body: {
        nl: "Het warmtepompseizoen verdubbelt het aantal klussen en niemand neemt voor drie maanden een tweede planner aan. Dit is wat dat met een planning doet, en wat je nu al kunt besluiten.",
        en: "Heat pump season doubles the job count and nobody hires a second planner for three months. Here is what that does to a schedule, and what you can decide now.",
      },
      contentType: "linkedin_post",
      channel: "linkedin",
      status: "ready_for_review",
      daysAgo: 2,
      objective: {
        nl: "Installateurs bereiken vóór de piek, niet tijdens.",
        en: "Catch installers before the rush, not during it.",
      },
    },
    {
      id: "draft-hp-2",
      ref: "heatpump/news-1",
      title: {
        nl: "Voor de warmtepompdrukte: een checklist voor je planning",
        en: "Before the heat pump rush: a planning checklist",
      },
      body: {
        nl: "Zes dingen die je in september beter regelt, van doorlooptijden voor subsidiepapieren tot wie op zaterdag de spoedmeldingen oppakt.",
        en: "Six things worth settling in September, from subsidy paperwork lead times to who takes the emergency calls on a Saturday.",
      },
      contentType: "newsletter",
      channel: "newsletter",
      status: "ready_for_review",
      daysAgo: 1,
      objective: {
        nl: "Praktische waarde, geen verkooppraatje.",
        en: "Practical value, no product pitch.",
      },
    },
  ],
};

function drafts(now: Date, locale: DemoLocale): MarketingContentDraft[] {
  const nl = locale === "nl";

  return Object.values(DRAFT_SEEDS)
    .flat()
    .map((seed) => ({
      id: seed.id,
      planActivityReference: seed.ref,
      contentType: seed.contentType,
      channel: seed.channel,
      objective: seed.objective[locale],
      targetAudience: nl
        ? "Eigenaren van installatiebedrijven"
        : "Installation company owners",
      title: seed.title[locale],
      body: seed.body[locale],
      callToAction: nl
        ? "Bekijk hoe een inrichting van vijf dagen verloopt"
        : "See how a five-day onboarding runs",
      keywords: ["planningssoftware", "installatiebedrijf", "onboarding"],
      rationale: {
        why: nl
          ? "Begint met de tijd tot live, de claim die geen enkele concurrent bestrijdt."
          : "Leads with time-to-live, which is the claim no competitor contests.",
        planActivityReference: seed.ref,
        strategyLinks: [],
      },
      sourceReferences: [
        { source: "marketing-understanding" as const, reference: "competitors" },
      ],
      confidence: "high" as const,
      status: seed.status,
      warnings: [],
      generatedAt: iso(now, -seed.daysAgo, 10),
    }));
}

/* ---------------- Work units — the join between campaigns and content ------ */

const UNIT_STATUS: Record<MarketingContentDraft["status"], WorkUnit["status"]> = {
  published: "monitoring",
  ready_to_publish: "scheduled",
  approved: "scheduled",
  ready_for_review: "review_ready",
  draft: "creating",
  rejected: "creating",
};

const DELIVERABLE: Record<string, WorkUnit["deliverableKind"]> = {
  linkedin: "linkedin",
  newsletter: "newsletter",
  blog: "blog",
  google_ads: "google_ad",
};

function workUnits(now: Date, peerId: string, locale: DemoLocale): WorkUnit[] {
  const nl = locale === "nl";
  const units: WorkUnit[] = [];

  for (const [projectId, seeds] of Object.entries(DRAFT_SEEDS)) {
    for (const seed of seeds) {
      units.push({
        id: `unit-${seed.id}`,
        peerId,
        projectId,
        role: DEMO_PEER_ROLE,
        title: seed.title[locale],
        status: UNIT_STATUS[seed.status],
        deliverableKind: DELIVERABLE[seed.channel] ?? "generic",
        channel: seed.channel,
        objective: seed.objective[locale],
        audience: nl
          ? "Eigenaren van installatiebedrijven"
          : "Installation company owners",
        needsVisual: seed.contentType === "linkedin_post",
        recurrence: "once",
        automationTrigger: null,
        draftId: seed.id,
        planActivityReference: seed.ref,
        rawRequest: seed.objective[locale],
        startedAt: iso(now, -seed.daysAgo - 2, 9),
        updatedAt: iso(now, -seed.daysAgo, 11),
        estimatedCompletionAt:
          seed.status === "ready_for_review" ? iso(now, 2, 12) : null,
        artifacts: [
          {
            id: `art-${seed.id}`,
            kind: "draft",
            label: seed.title[locale],
            refId: seed.id,
          },
        ],
        eventLog: [],
        paused: false,
        cancelled: false,
      });
    }
  }

  return units;
}

/* ---------------- The working agreement ------------------------------------ */

export function demoResponsibilities(
  now: Date = new Date(),
  peerId: string = DEMO_PEER_ID,
  locale: DemoLocale = "nl"
): MarketingResponsibility[] {
  const nl = locale === "nl";
  const shared = {
    peerId,
    createdAt: iso(now, -60, 9),
    updatedAt: iso(now, -6, 15),
    guardrails: {},
  };

  return [
    {
      ...shared,
      id: "resp-linkedin",
      title: nl ? "Plaatsen op LinkedIn" : "LinkedIn posting",
      description: nl
        ? "Schrijft en plaatst berichten binnen de afgesproken thema's."
        : "Writes and publishes posts on the agreed pillars.",
      category: "linkedin",
      goal: nl
        ? "Het argument over snel live gaan wekelijks onder ogen van eigenaren houden."
        : "Keep the onboarding argument in front of owners weekly.",
      successMetric: nl
        ? "Twee berichten per week, bereik dat oploopt"
        : "Two posts a week, reach trending up",
      cadence: { type: "weekly", postsPerWeek: 2 },
      autonomyLevel: "autonomous",
      approvalPolicy: "fully_automatic",
      priority: 1,
      status: "enabled",
      enabled: true,
      guardrails: {
        maxPostsPerWeek: 3,
        brandTone: nl ? "Direct en praktisch, geen jargon" : "Direct, practical, no jargon",
        imageGenerationPolicy: "when_needed",
      },
    },
    {
      ...shared,
      id: "resp-competitors",
      title: nl ? "Concurrenten volgen" : "Competitor monitoring",
      description: nl
        ? "Houdt bij wat de drie vastgelegde concurrenten publiek beweren."
        : "Tracks what the three recorded competitors claim publicly.",
      category: "competitor_monitoring",
      goal: nl
        ? "Merken wanneer iemand zelf over snelheid van inrichten begint."
        : "Notice when someone starts arguing about onboarding speed.",
      cadence: { type: "weekly", evaluationIntervalDays: 7 },
      autonomyLevel: "autonomous",
      approvalPolicy: "fully_automatic",
      priority: 2,
      status: "enabled",
      enabled: true,
      guardrails: { competitorMonitoringFrequency: "weekly" },
    },
    {
      ...shared,
      id: "resp-newsletter",
      title: nl ? "Nieuwsbrief" : "Newsletter",
      description: nl
        ? "Schrijft de maandelijkse notitie aan de lijst."
        : "Drafts the monthly note to the list.",
      category: "newsletter",
      goal: nl
        ? "Eén verzending per maand die zijn openingsratio verdient."
        : "One send a month that earns its open rate.",
      cadence: { type: "monthly" },
      autonomyLevel: "semi_autonomous",
      approvalPolicy: "approval_required",
      priority: 3,
      status: "enabled",
      enabled: true,
    },
    {
      ...shared,
      id: "resp-blog",
      title: nl ? "Blog en SEO-artikelen" : "Blog and SEO articles",
      description: nl
        ? "Schrijft langere stukken op seizoens- en bezwaartermen."
        : "Writes long-form against the seasonal and objection terms.",
      category: "seo",
      goal: nl
        ? "Scoren op het bezwaar, niet op de categorieterm."
        : "Rank for the objection, not the category term.",
      cadence: { type: "monthly", evaluationIntervalDays: 30 },
      autonomyLevel: "semi_autonomous",
      approvalPolicy: "approval_required",
      priority: 4,
      status: "enabled",
      enabled: true,
    },
    {
      ...shared,
      id: "resp-ads-budget",
      title: nl ? "Budget van Google Ads aanpassen" : "Google Ads budget changes",
      description: nl
        ? "Past de besteding op de demo-campagnes aan."
        : "Adjusts spend across the demo campaigns.",
      category: "google_ads",
      goal: nl
        ? "De kosten per ingeplande demo onder controle houden."
        : "Keep cost per booked demo under control.",
      cadence: { type: "weekly" },
      autonomyLevel: "semi_autonomous",
      approvalPolicy: "approval_required",
      priority: 5,
      status: "enabled",
      enabled: true,
      guardrails: { maxBudgetChangePercent: 15, maxMonthlySpend: 2500 },
    },
    {
      ...shared,
      id: "resp-pricing",
      title: nl ? "Alles waar een prijs in staat" : "Anything that states a price",
      description: nl
        ? "Prijspagina's, offertes en beweringen over korting."
        : "Pricing pages, quotes and discount claims.",
      category: "website",
      goal: nl
        ? "Prijs is een besluit van de eigenaar, niet van mij."
        : "Pricing is the founder's call, not mine.",
      cadence: { type: "event_based" },
      autonomyLevel: "manual",
      approvalPolicy: "approval_required",
      priority: 6,
      status: "disabled",
      enabled: false,
    },
  ] as MarketingResponsibility[];
}

/* ---------------- Connections and what they report ------------------------- */

function connections(now: Date): IntegrationConnection[] {
  const synced = iso(now, 0, 6);
  return [
    {
      id: "linkedin",
      label: "LinkedIn",
      status: "connected",
      settingsHref: "/integrations?provider=linkedin",
      lastSyncedAt: synced,
    },
    {
      id: "ga4",
      label: "GA4",
      status: "connected",
      settingsHref: "/integrations?provider=ga4",
      lastSyncedAt: synced,
    },
    {
      id: "hubspot",
      label: "HubSpot",
      status: "connected",
      settingsHref: "/integrations?provider=hubspot",
      lastSyncedAt: synced,
    },
    {
      id: "mailchimp",
      label: "Mailchimp",
      status: "connected",
      settingsHref: "/integrations?provider=mailchimp",
      lastSyncedAt: synced,
    },
    {
      id: "google_ads",
      label: "Google Ads",
      status: "connected",
      settingsHref: "/integrations?provider=google_ads",
      lastSyncedAt: synced,
    },
    // One genuinely unconnected channel. A demo where everything is perfect
    // teaches the prospect nothing about how the product behaves when it isn't.
    {
      id: "instagram",
      label: "Instagram",
      status: "not_connected",
      settingsHref: "/integrations?provider=instagram",
      lastSyncedAt: null,
    },
  ];
}

/**
 * Channel-reported figures.
 *
 * These are the numbers a connected source would return, and they are sized to
 * the work that actually exists in this workspace: six published pieces, four
 * of them on LinkedIn, over roughly four weeks. The ratios are deliberately
 * ordinary — a demo that shows a 40% conversion rate teaches a prospect to
 * distrust everything else on the screen.
 */
function storedMetrics(now: Date, peerId: string, locale: DemoLocale): MetricSnapshot[] {
  const periodStart = iso(now, -30, 0);
  const periodEnd = iso(now, 0, 0);
  const recordedAt = iso(now, 0, 6);

  const metric = (
    id: string,
    provider: MetricSnapshot["provider"],
    metricKey: string,
    label: string,
    value: string,
    unit: string | null
  ): MetricSnapshot => ({
    id,
    peerId,
    provider,
    metricKey,
    label,
    value,
    unit,
    periodStart,
    periodEnd,
    recordedAt,
  });

  // Snapshots are keyed by `metricKey`, which is what the Office resolves on.
  // The label is display text for surfaces that show it raw.
  //
  // These are the figures a connected source would return for a workspace this
  // size: six published pieces over four weeks, four of them on LinkedIn, one
  // paid campaign just live. The ratios are deliberately ordinary — a demo
  // showing a 40% conversion rate teaches a prospect to distrust everything
  // else on the screen.
  //
  // Every provider here is `connected` in `connections()`. Instagram and
  // Search Console are not, so nothing is authored for them: those sections
  // must render as honest connection opportunities, which is half of what the
  // demo exists to show.
  const decimal = locale === "nl" ? "," : ".";
  const money = (whole: string) => `€ ${whole}`;

  return [
    /* ---- Attribution: the question an owner asks first ------------------ */
    metric("m-revenue", "hubspot", "attributed_revenue", "Revenue influenced", money("41.200"), null),
    metric("m-attr-leads", "hubspot", "attributed_leads", "Attributed leads", "48", null),

    /* ---- Overview ------------------------------------------------------- */
    metric("m-leads", "hubspot", "leads", "Leads", "63", null),
    metric("m-reach", "ga4", "reach", "Reach", "18.420", null),
    metric("m-engagement", "linkedin", "engagement", "Engagement", "1.284", null),

    /* ---- Channels ------------------------------------------------------- */
    metric("m-li-reach", "linkedin", "linkedin_reach", "LinkedIn reach", "12.960", null),
    metric("m-google-spend", "google_ads", "google_spend", "Google Ads spend", money("1.840"), null),

    /* ---- Campaigns ------------------------------------------------------ */
    metric("m-camp-roas", "google_ads", "campaign_roas", "Campaign ROAS", `3${decimal}2×`, null),
    metric("m-camp-leads", "google_ads", "campaign_leads", "Campaign leads", "21", null),
    metric("m-camp-cpa", "google_ads", "campaign_cpa", "Campaign CPA", money("87"), null),

    /* ---- Paid media -----------------------------------------------------
     * Account-level, across all paid activity. Deliberately different from the
     * campaign figures above: the Q4 push outperforms the account average,
     * which is the whole reason she singles it out. Identical values in both
     * sections would read as the page repeating itself.
     */
    metric("m-roas", "google_ads", "roas", "ROAS", `2${decimal}8×`, null),
    metric("m-ctr", "google_ads", "ctr", "CTR", `4${decimal}1`, "%"),
    metric("m-cpc", "google_ads", "cpc", "CPC", money(`1${decimal}94`), null),
    metric("m-cpa", "google_ads", "cpa", "CPA", money("94"), null),

    /* ---- Content -------------------------------------------------------- */
    metric("m-content-clicks", "ga4", "content_clicks", "Content clicks", "2.106", null),
    metric("m-content-eng", "linkedin", "content_engagement", "Content engagement", "912", null),

    /* ---- Deliberately absent -------------------------------------------
     * seo_clicks / seo_impressions / seo_rankings — Search Console is not
     * connected, so Organic visibility must render as an opportunity.
     * instagram_reach — Instagram is not connected either.
     * hours_saved — the only producer is an estimate, and §12 forbids it.
     * -------------------------------------------------------------------- */
  ];
}

/* ---------------- What she has been doing ---------------------------------- */

function activityFeed(now: Date, locale: DemoLocale): ActivityFeedItem[] {
  const nl = locale === "nl";

  return [
    {
      id: "act-2",
      timestamp: iso(now, -1, 10),
      activityType: "draft_generated",
      title: nl ? "Strategie voor warmtepompseizoen vastgelegd" : "Heat pump season strategy recorded",
      description: nl
        ? "Emma koos LinkedIn, e-mail en nieuwsbrief op basis van concurrentie en timing."
        : "Emma chose LinkedIn, email, and newsletter based on competition and timing.",
      relatedObject: "heatpump/strategy",
    },
    {
      id: "act-3",
      timestamp: iso(now, 0, 9),
      activityType: "draft_generated",
      title: nl ? "Deliverables voor warmtepompseizoen gemaakt" : "Heat pump season deliverables created",
      description: nl
        ? "Drie stukken staan klaar voor jouw review."
        : "Three pieces are ready for your review.",
      relatedObject: "heatpump/news-1",
    },
    {
      id: "act-4",
      timestamp: iso(now, -1, 14),
      activityType: "strategy_completed",
      title: nl ? "Campagnestrategie gestart — automatische modus" : "Campaign strategy started — automatic mode",
      description: nl
        ? "Doel: installateurs bereiken vóór de najaarspiek."
        : "Goal: reach installers before the autumn rush.",
      relatedObject: "heatpump/start",
    },
  ];
}

/* ---------------- The workspace -------------------------------------------- */

/** The demo ships in the customer's language, like the rest of the product. */
export type DemoLocale = "nl" | "en";

export type DemoWorkspaceOptions = {
  /** Injected by tests so date-derived output stays deterministic. */
  now?: Date;
  /**
   * Defaults to Dutch: Veldwerk is a Dutch company selling to Dutch installers,
   * and the app's own locale is Dutch. English is kept for demos abroad.
   */
  locale?: DemoLocale;
  userName?: string;
  /**
   * Overridden by the in-memory demo store once a prospect has moved a
   * boundary, so their change survives navigation between destinations.
   */
  responsibilities?: MarketingResponsibility[];
};

/**
 * Builds the demo workspace as a domain input the ordinary adapters can read.
 *
 * Nothing downstream knows this is a demo: the Desk briefing, the grounding
 * gate and the attribution helpers all behave exactly as they do for a real
 * customer. That is the point — a prospect is looking at the real product,
 * pointed at a fictional company.
 */
export function buildDemoDomainInput(
  options: DemoWorkspaceOptions = {}
): MarketingPeerDomainInput {
  const now = options.now ?? new Date();
  const locale: DemoLocale = options.locale ?? "nl";
  const peerId = DEMO_PEER_ID;

  return {
    peerId,
    organizationId: undefined,
    userName: options.userName ?? "there",
    peerName: DEMO_PEER_NAME,
    campaignTitle: locale === "nl" ? "Klaar voor het warmtepompseizoen" : "Heat pump season readiness",
    generating: null,
    generatingActivity: null,
    understanding: understanding(now, locale),
    strategy: strategy(now, locale),
    plan: null,
    drafts: drafts(now, locale),
    publicationPackages: [],
    activityFeed: activityFeed(now, locale),
    workUnits: workUnits(now, peerId, locale),
    projects: projects(now, peerId, locale),
    responsibilities:
      options.responsibilities ?? demoResponsibilities(now, peerId, locale),
    automations: [],
    connections: connections(now),
    storedMetrics: storedMetrics(now, peerId, locale),
  };
}
