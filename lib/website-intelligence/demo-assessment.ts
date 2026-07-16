import type {
  AssessmentFinding,
  ConfidenceSnapshot,
  EvidenceCategory,
  QualitativeConfidence,
  WebsiteIntelligenceAssessment,
} from "./types";

function titleCase(value: string) {
  return value
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferIndustry(hostname: string) {
  const lower = hostname.toLowerCase();

  if (lower.includes("shop") || lower.includes("store") || lower.includes("retail")) {
    return "E-commerce & Retail";
  }

  if (lower.includes("health") || lower.includes("care") || lower.includes("med")) {
    return "Healthcare & Wellness";
  }

  if (lower.includes("finance") || lower.includes("bank") || lower.includes("pay")) {
    return "Financial Services";
  }

  if (lower.includes("tech") || lower.includes("software") || lower.includes("saas")) {
    return "Technology & SaaS";
  }

  return "Professional Services";
}

function finding(
  id: string,
  statement: string,
  category: EvidenceCategory,
  options?: Partial<Pick<AssessmentFinding, "evidence" | "enrichmentHint" | "source">>
): AssessmentFinding {
  return {
    id,
    statement,
    category,
    source: options?.source ?? "website",
    evidence: options?.evidence,
    enrichmentHint: options?.enrichmentHint,
  };
}

function countByCategory(findings: AssessmentFinding[]) {
  return findings.reduce(
    (acc, item) => {
      if (item.category === "observed") acc.observed += 1;
      if (item.category === "likely") acc.likely += 1;
      if (item.category === "unknown") acc.unknown += 1;
      if (item.category === "requires-more-data") acc.requiresMoreData += 1;
      return acc;
    },
    { observed: 0, likely: 0, unknown: 0, requiresMoreData: 0 }
  );
}

function deriveOverallConfidence(counts: {
  observed: number;
  likely: number;
  unknown: number;
  requiresMoreData: number;
}): QualitativeConfidence {
  const total =
    counts.observed +
    counts.likely +
    counts.unknown +
    counts.requiresMoreData;

  if (total === 0) return "low";

  const observedRatio = counts.observed / total;
  const gapRatio = (counts.unknown + counts.requiresMoreData) / total;

  if (observedRatio >= 0.35 && gapRatio <= 0.25) return "high";
  if (gapRatio >= 0.45) return "low";
  return "moderate";
}

export function collectAllFindings(
  assessment: Omit<WebsiteIntelligenceAssessment, "confidenceSnapshot">
): AssessmentFinding[] {
  const { companyDna, customerJourney, marketingGrowth, operations, workforceRecommendations } =
    assessment;

  return [
    ...companyDna.findings,
    ...customerJourney.frictionPoints,
    ...customerJourney.opportunities,
    ...marketingGrowth.observed,
    ...marketingGrowth.likely,
    ...marketingGrowth.unknown,
    ...operations.areas.flatMap((area) => area.findings),
    ...workforceRecommendations.recommendations.flatMap((rec) => rec.supportingFindings),
  ];
}

export function buildConfidenceSnapshot(
  findings: AssessmentFinding[],
  overallReason: string
): ConfidenceSnapshot {
  const counts = countByCategory(findings);
  const overall = deriveOverallConfidence(counts);

  return {
    ...counts,
    overall,
    overallReason,
  };
}

export function buildDemoAssessment(
  url: string,
  hostname: string
): WebsiteIntelligenceAssessment {
  const companyName = titleCase(hostname.split(".")[0] ?? hostname);
  const industry = inferIndustry(hostname);

  const companyDnaFindings: AssessmentFinding[] = [
    finding(
      "dna-1",
      `${companyName} presents as a ${industry.toLowerCase()} business with a public website at ${hostname}.`,
      "observed",
      { evidence: "Domain and publicly accessible site confirmed." }
    ),
    finding(
      "dna-2",
      "The company likely sells to business decision-makers rather than purely consumer impulse buyers.",
      "likely",
      { evidence: "Professional services site structure and contact-led conversion pattern." }
    ),
    finding(
      "dna-3",
      "Brand tone appears consultative — emphasising expertise and trust over aggressive promotion.",
      "likely",
      { evidence: "Service-oriented page hierarchy inferred from standard industry templates." }
    ),
    finding(
      "dna-4",
      "Exact revenue model and pricing strategy remain unconfirmed without deeper site or CRM data.",
      "unknown",
      { enrichmentHint: "Connect CRM or share pricing pages for confirmation." }
    ),
  ];

  const journeyFriction: AssessmentFinding[] = [
    finding(
      "journey-f1",
      "Visitors must navigate multiple pages before finding a clear next step.",
      "likely",
      { evidence: "Typical B2B site architecture with separated service and contact flows." }
    ),
    finding(
      "journey-f2",
      "Response time after enquiry is unknown — a common drop-off point for inbound interest.",
      "unknown",
      { enrichmentHint: "Connect CRM to observe lead response patterns." }
    ),
    finding(
      "journey-f3",
      "Trust signals such as testimonials or case studies appear expected for this category.",
      "likely",
      { evidence: "Industry norm for professional services conversion." }
    ),
  ];

  const journeyOpportunities: AssessmentFinding[] = [
    finding(
      "journey-o1",
      "Always-on qualification on the contact path could capture interest outside business hours.",
      "likely",
      { evidence: "Contact and demo request patterns on comparable sites." }
    ),
    finding(
      "journey-o2",
      "Post-enquiry follow-up is a likely automation opportunity once lead volume is known.",
      "requires-more-data",
      {
        source: "crm",
        enrichmentHint: "Connect CRM to confirm enquiry volume and follow-up gaps.",
      }
    ),
  ];

  const marketingObserved: AssessmentFinding[] = [
    finding(
      "mkt-o1",
      "A public website exists as the primary owned marketing channel.",
      "observed",
      { evidence: `Site reachable at ${hostname}.` }
    ),
  ];

  const marketingLikely: AssessmentFinding[] = [
    finding(
      "mkt-l1",
      "Content marketing likely supports credibility — blog, resources, or case studies may exist.",
      "likely",
      { evidence: "Common pattern for businesses in this category." }
    ),
    finding(
      "mkt-l2",
      "Inbound traffic quality and campaign performance cannot be assessed from the website alone.",
      "requires-more-data",
      {
        source: "analytics",
        enrichmentHint: "Connect Google Analytics to observe traffic sources and conversion paths.",
      }
    ),
  ];

  const marketingUnknown: AssessmentFinding[] = [
    finding(
      "mkt-u1",
      "Paid campaign spend, ROAS, and channel mix are unknown.",
      "unknown",
      {
        source: "analytics",
        enrichmentHint: "Analytics connection required for campaign visibility.",
      }
    ),
    finding(
      "mkt-u2",
      "Email list size, nurture sequences, and retention marketing are unknown.",
      "unknown",
      { enrichmentHint: "Connect marketing automation or CRM when available." }
    ),
  ];

  const operationsAreas = [
    {
      id: "planning",
      name: "Planning",
      findings: [
        finding(
          "ops-plan-1",
          "Meeting scheduling and calendar coordination may consume repetitive admin time.",
          "likely",
          { evidence: "Contact and booking flows detected on comparable sites." }
        ),
      ],
    },
    {
      id: "support",
      name: "Support",
      findings: [
        finding(
          "ops-sup-1",
          "FAQ-style and policy content suggests repeatable customer questions.",
          "likely",
          { evidence: "Standard support page patterns for the industry." }
        ),
        finding(
          "ops-sup-2",
          "Ticket volume and resolution times are not yet available.",
          "requires-more-data",
          {
            source: "operations-scan",
            enrichmentHint: "Operations scan or helpdesk integration would confirm support load.",
          }
        ),
      ],
    },
    {
      id: "lead-handling",
      name: "Lead handling",
      findings: [
        finding(
          "ops-lead-1",
          "Inbound enquiries likely require qualification before human follow-up.",
          "likely",
          { evidence: "Contact and demo request entry points." }
        ),
      ],
    },
    {
      id: "scheduling",
      name: "Scheduling",
      findings: [
        finding(
          "ops-sch-1",
          "Appointment booking and reminders are a plausible automation target.",
          "likely",
          { evidence: "Sales-led businesses typically coordinate calls after initial contact." }
        ),
      ],
    },
    {
      id: "communication",
      name: "Communication",
      findings: [
        finding(
          "ops-com-1",
          "Consistent follow-up messaging after first contact is likely inconsistent without automation.",
          "likely",
          { evidence: "Common gap when teams rely on manual email follow-up." }
        ),
      ],
    },
  ];

  const salesFindings: AssessmentFinding[] = [
    finding(
      "wf-sales-1",
      "The website appears designed to generate inbound interest that needs timely human follow-up.",
      "likely",
      { evidence: "Contact-led conversion pattern." }
    ),
    finding(
      "wf-sales-2",
      "Lead response speed and pipeline stage data are not connected.",
      "requires-more-data",
      { source: "crm", enrichmentHint: "CRM would confirm where leads stall." }
    ),
  ];

  const supportFindings: AssessmentFinding[] = [
    finding(
      "wf-support-1",
      "Policy, pricing, and service pages suggest recurring customer questions.",
      "likely",
      { evidence: "Support-oriented content structure." }
    ),
  ];

  const marketingFindings: AssessmentFinding[] = [
    finding(
      "wf-mkt-1",
      "The website relies on inbound traffic but campaign visibility is currently unavailable.",
      "requires-more-data",
      {
        source: "analytics",
        enrichmentHint: "Connect Google Analytics to confirm traffic reliance and gaps.",
      }
    ),
    finding(
      "wf-mkt-2",
      "Content structure suggests room to scale on-brand marketing output.",
      "likely",
      { evidence: "Resource and service page hierarchy." }
    ),
  ];

  const plannerFindings: AssessmentFinding[] = [
    finding(
      "wf-plan-1",
      "Scheduling becomes more valuable once sales and support peers generate meetings.",
      "likely",
      { evidence: "Downstream workflow dependency." }
    ),
  ];

  const workforceRecommendations = [
    {
      employeeType: "Sales Employee",
      role: "Sales",
      name: "Sales Peer",
      priority: "high" as const,
      whyRecommended: `Recommended because ${companyName}'s website appears to drive inbound interest, but lead response patterns and CRM data are not yet connected — an AI sales peer could qualify visitors and book next steps while those gaps are closed.`,
      supportingFindings: salesFindings,
      suggestedObjective: `Qualify visitors on ${hostname}, answer product questions, and book meetings with the sales team.`,
      gradient: "from-violet-500 to-blue-600",
    },
    {
      employeeType: "Customer Success Employee",
      role: "Support",
      name: "Support Peer",
      priority: "high" as const,
      whyRecommended: `Recommended because policy, pricing, and service pages suggest repeatable customer questions — a support peer could resolve these using website and knowledge content once connected.`,
      supportingFindings: supportFindings,
      suggestedObjective: `Answer customer questions about ${companyName} using website content and approved knowledge sources.`,
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      employeeType: "Marketing Employee",
      role: "Marketing",
      name: "Marketing Peer",
      priority: "medium" as const,
      whyRecommended: `Recommended because the website relies heavily on inbound traffic but campaign visibility is currently unavailable — a marketing peer could draft on-brand content while analytics integration is pending.`,
      supportingFindings: marketingFindings,
      suggestedObjective: `Create on-brand marketing content and campaign drafts aligned with ${companyName}'s positioning.`,
      gradient: "from-fuchsia-500 to-violet-600",
    },
    {
      employeeType: "Planner",
      role: "Planning",
      name: "Planning Peer",
      priority: "optional" as const,
      whyRecommended: `Recommended as a secondary hire once sales and support peers begin generating meetings — scheduling and reminder workflows would then become the next bottleneck.`,
      supportingFindings: plannerFindings,
      suggestedObjective:
        "Manage appointment scheduling, reminders, and calendar coordination for inbound requests.",
      gradient: "from-orange-500 to-pink-600",
    },
  ];

  const assessmentBody = {
    meta: {
      url,
      companyName,
      industry,
      analyzedAt: new Date().toISOString(),
      analysisVersion: "orion-2.0-demo",
    },
    executiveSummary: {
      conclusion: `${companyName} looks like a ${industry.toLowerCase()} business with a credible public presence — but several growth and operations signals remain disconnected.`,
      rationale: `Based on the website at ${hostname}, the strongest near-term opportunity is capturing and qualifying inbound interest. Marketing performance and operational load cannot yet be confirmed without analytics, knowledge, and CRM connections.`,
      confidence: {
        level: "moderate" as const,
        reason:
          "The website provides useful positioning context, but marketing and operational data are not yet connected.",
      },
    },
    companyDna: {
      businessType: `${industry} — service-led, digitally presented`,
      targetCustomers: "Business decision-makers seeking expertise and reliable delivery",
      brandPresentation: "Consultative and trust-oriented — expertise over hard selling",
      findings: companyDnaFindings,
      confidence: {
        level: "moderate" as const,
        reason:
          "Business type and presentation are inferred clearly from the site; revenue model and ICP precision need CRM or sales data.",
      },
    },
    customerJourney: {
      frictionPoints: journeyFriction,
      opportunities: journeyOpportunities,
      confidence: {
        level: "low" as const,
        reason:
          "Journey friction is inferred from site patterns — funnel analytics would be needed to confirm where visitors actually drop off.",
      },
    },
    marketingGrowth: {
      observed: marketingObserved,
      likely: marketingLikely,
      unknown: marketingUnknown,
      enrichmentSlots: [
        {
          source: "analytics" as const,
          label: "Google Analytics",
          status: "not-connected" as const,
          href: "/knowledge",
          unlocks: ["mkt-l2", "mkt-u1", "wf-mkt-1"],
        },
        {
          source: "knowledge" as const,
          label: "Knowledge base",
          status: "not-connected" as const,
          href: "/knowledge",
          unlocks: ["content-gaps"],
        },
      ],
      confidence: {
        level: "low" as const,
        reason:
          "Only the owned website channel is confirmed — campaign performance and retention marketing remain unknown.",
      },
    },
    operations: {
      areas: operationsAreas,
      enrichmentSlots: [
        {
          source: "operations-scan" as const,
          label: "Operations scan",
          status: "not-connected" as const,
          unlocks: ["ops-sup-2"],
        },
        {
          source: "crm" as const,
          label: "CRM",
          status: "not-connected" as const,
          unlocks: ["ops-lead-1", "journey-f2"],
        },
      ],
      confidence: {
        level: "moderate" as const,
        reason:
          "Automation opportunities are plausible from website patterns, but ticket volume and handoff delays need operations or CRM data.",
      },
    },
    workforceRecommendations: {
      recommendations: workforceRecommendations,
      confidence: {
        level: "moderate" as const,
        reason:
          "Recommendations follow logically from website signals, but priority order would sharpen with analytics and CRM connected.",
      },
    },
    businessBrainConclusion: {
      statement: `If I were your Chief of Staff, I would begin by deploying a Sales Peer to qualify inbound interest on ${hostname} — then connect analytics and knowledge so marketing and support recommendations move from likely to observed.`,
      primaryAction: {
        label: "Create Sales Peer",
        onCreatePeerIndex: 0,
      },
      confidence: {
        level: "moderate" as const,
        reason:
          "The starting move is clear from website signals; confidence in sequencing would increase once CRM and analytics are connected.",
      },
    },
  };

  const allFindings = collectAllFindings(assessmentBody);
  const confidenceSnapshot = buildConfidenceSnapshot(
    allFindings,
    "Confidence is currently moderate because the website provides useful business context, but marketing and operational data are not yet connected."
  );

  return {
    ...assessmentBody,
    confidenceSnapshot,
  };
}
