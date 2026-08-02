/**
 * Deterministic demo-only campaign workflow simulation.
 * No AI, no Project Brain, no live persistence — session-local demo store only.
 */
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { CreateMarketingCampaignProjectInput } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import {
  buildCampaignContextFromCreateInput,
  type CampaignContext,
} from "@/lib/office/campaign/campaign-context";
import {
  channelRationaleFor,
  generateSimulatedCopy,
  resolveDeliverableSpecs,
  type SimulatedCopyBundle,
} from "@/lib/office/campaign/generate-campaign-simulation";
import { DEMO_PEER_ROLE } from "./demo-company";

export type DemoStepApprovalStatus = "approved" | "changes_requested" | "rejected" | "pending";

export type DemoCampaignSimulationBundle = {
  projectId: string;
  campaignContext: CampaignContext;
  drafts: MarketingContentDraft[];
  workUnits: WorkUnit[];
  stepApprovals: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>>;
  deliverablesUnlocked: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

function slug(id: string, suffix: string): string {
  return `${id}-${suffix}`;
}

function seedTemplateForGoal(goalId: string, campaignName: string, nl: boolean): SimulatedCopyBundle {
  const lead = goalId === "generate_leads" || goalId.includes("lead");
  const brand = goalId === "brand_awareness";
  if (nl) {
    return {
      objective: lead
        ? "Demo-aanvragen genereren bij installatie-eigenaren"
        : brand
          ? "Naamsbekendheid vergroten in de installatiesector"
          : `Doel van campagne: ${campaignName}`,
      linkedinTitle: lead
        ? "Waarom planning nu het verschil maakt voor installateurs"
        : "Wat Veldwerk anders doet — en waarom het ertoe doet",
      linkedinBody: lead
        ? "Elk najaar verdubbelt het aantal klussen. De meeste installateurs die ik spreek wachten tot oktober."
        : "Veldwerk krijgt een installatieploeg in een week ingepland — niet in een kwartaal.",
      emailSubject: lead ? "Checklist: klaar voor het seizoen vóór de piek" : "Eén ding dat installateurs nu al kunnen regelen",
      emailBody:
        "From: Emma @ Veldwerk <emma@veldwerk.nl>\nTo: Eigenaren van installatiebedrijven\n---\nHallo,\n\nChecklist met zes dingen die je nú al kunt regelen.\n\nGroet,\nEmma",
      newsletterTitle: "Vóór de piek: wat slimme installateurs nu al regelen",
      newsletterBody: "Zes dingen die je in september beter regelt voor het warmtepompseizoen.",
      adsBody: `Campaign: ${campaignName}\nHeadline 1: Planning in een week live\nHeadline 2: Gebouwd voor installatieploegen`,
      landingBody: "Hero: Klaar vóór het seizoen begint\nCTA: Download de checklist",
      channelRationale: {
        linkedin: "LinkedIn bereikt eigenaren waar ze peers volgen.",
        email: "E-mail levert hoge intentie vóór het seizoen begint.",
        newsletter: "Nieuwsbrief houdt de lijst warm.",
        google_ads: "Search vangt eigenaren met koopintentie op.",
        website_landing: "Landingspagina vangt traffic van ads en e-mail.",
      },
    };
  }
  return {
    objective: lead ? "Generate demo requests from installation company owners" : `Campaign goal: ${campaignName}`,
    linkedinTitle: lead ? "Why planning matters now for installers" : "What Veldwerk does differently",
    linkedinBody: "Every autumn the job count doubles. Most installers wait until October.",
    emailSubject: lead ? "Checklist: ready before the rush" : "One thing installers can settle now",
    emailBody: "From: Emma @ Veldwerk\n---\nHi,\n\nShort checklist.\n\nBest,\nEmma",
    newsletterTitle: "Before the rush: what smart installers settle now",
    newsletterBody: "Six things worth deciding before heat pump season.",
    adsBody: `Campaign: ${campaignName}\nHeadline 1: Planned in one week`,
    landingBody: "Hero: Ready before the season starts\nCTA: Download the checklist",
    channelRationale: {
      linkedin: "LinkedIn reaches owners where they follow peers.",
      email: "Email delivers high intent before the season.",
      newsletter: "Newsletter keeps the list warm.",
      google_ads: "Search catches owners with buying intent.",
      website_landing: "Landing page captures traffic from ads and email.",
    },
  };
}

function buildDraft(
  id: string,
  projectId: string,
  ref: string,
  draft: Omit<MarketingContentDraft, "id" | "planActivityReference" | "generatedAt" | "status" | "warnings"> & {
    status: MarketingContentDraft["status"];
  }
): MarketingContentDraft {
  return {
    ...draft,
    id,
    planActivityReference: ref,
    generatedAt: nowIso(),
    warnings: [],
  };
}

function buildUnit(
  id: string,
  projectId: string,
  peerId: string,
  draft: MarketingContentDraft,
  unitStatus: WorkUnit["status"],
  audience: string
): WorkUnit {
  return {
    id,
    peerId,
    projectId,
    role: DEMO_PEER_ROLE,
    title: draft.title,
    status: unitStatus,
    deliverableKind:
      draft.channel === "linkedin"
        ? "linkedin"
        : draft.channel === "google_ads"
          ? "google_ad"
          : draft.channel === "newsletter" || draft.channel === "email"
            ? "newsletter"
            : draft.channel === "blog"
              ? "blog"
              : "generic",
    channel: draft.channel ?? "content",
    objective: draft.objective,
    audience,
    needsVisual: draft.contentType === "linkedin_post",
    recurrence: "once",
    automationTrigger: null,
    draftId: draft.id,
    planActivityReference: draft.planActivityReference,
    rawRequest: draft.objective,
    startedAt: nowIso(),
    updatedAt: nowIso(),
    estimatedCompletionAt: null,
    artifacts: [{ id: `art-${draft.id}`, kind: "draft", label: draft.title, refId: draft.id }],
    eventLog: [],
    paused: false,
    cancelled: false,
  };
}

function initialStepApprovals(ctx: CampaignContext): Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>> {
  const approvals: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>> = {};

  if (
    ctx.companyContextState === "available" ||
    ctx.companyContextState === "simulated_analysis_complete" ||
    ctx.companyContextState === "real_analysis_complete"
  ) {
    approvals.business_analyzed = "approved";
  }

  if (
    ctx.websiteState === "simulated_analysis_complete" ||
    ctx.websiteState === "real_analysis_complete" ||
    ctx.websiteState === "skipped"
  ) {
    approvals.website_analyzed = "approved";
  }

  if (
    ctx.competitorContextState === "simulated" ||
    ctx.competitorContextState === "simulated_analysis_complete" ||
    ctx.competitorContextState === "real_analysis_complete" ||
    ctx.competitorContextState === "skipped"
  ) {
    approvals.competitors_analyzed = "approved";
  }

  if (ctx.executionMode === "fully_automatic" && approvals.business_analyzed === "approved") {
    approvals.strategy_determined = "approved";
    approvals.channels_selected = "approved";
    approvals.deliverables_created = "approved";
    approvals.waiting_for_approval = "approved";
  }

  return approvals;
}

function buildDraftsFromContext(
  project: MarketingProject,
  ctx: CampaignContext,
  copy: SimulatedCopyBundle,
  unlocked: boolean,
  fullyAuto = false
): MarketingContentDraft[] {
  const specs = resolveDeliverableSpecs(ctx);
  const campaignRef = project.id.replace("camp-", "").slice(0, 12);
  const draftStatus: MarketingContentDraft["status"] = unlocked
    ? fullyAuto
      ? "approved"
      : "ready_for_review"
    : "draft";
  const nl = ctx.locale === "nl";
  const audience = ctx.audience || (nl ? "Je doelgroep" : "Your audience");

  const bodyFor = (spec: (typeof specs)[0]) => {
    switch (spec.titleKey) {
      case "linkedin":
        return copy.linkedinBody;
      case "email":
        return copy.emailBody;
      case "newsletter":
        return copy.newsletterBody;
      case "ads":
        return copy.adsBody;
      case "landing":
        return copy.landingBody;
      default:
        return copy.objective;
    }
  };

  const titleFor = (spec: (typeof specs)[0]) => {
    switch (spec.titleKey) {
      case "linkedin":
        return copy.linkedinTitle;
      case "email":
        return copy.emailSubject;
      case "newsletter":
        return copy.newsletterTitle;
      case "ads":
        return nl ? `Google Ads — ${ctx.campaignName}` : `Google Ads — ${ctx.campaignName}`;
      case "landing":
        return nl ? `Landingspagina — ${ctx.campaignName}` : `Landing page — ${ctx.campaignName}`;
      default:
        return ctx.campaignName;
    }
  };

  const suffixFor = (channel: string, index: number) => {
    const map: Record<string, string> = {
      linkedin: "li",
      email: "email",
      newsletter: "news",
      google_ads: "ads",
      website_landing: "lp",
      blog: "blog",
      instagram: "ig",
    };
    return map[channel] ?? `d${index}`;
  };

  return specs.map((spec, index) => {
    const suffix = suffixFor(spec.channel, index);
    const channel = spec.channel;
    return buildDraft(slug(project.id, suffix), project.id, `${campaignRef}/${suffix}-1`, {
      contentType: spec.contentType,
      channel,
      objective: copy.objective,
      targetAudience: audience,
      title: titleFor(spec),
      body: bodyFor(spec),
      callToAction: nl
        ? ctx.goals.some((g) => /demo|lead/i.test(g))
          ? "Plan een demo"
          : "Meer lezen"
        : "Learn more",
      keywords: [ctx.companyName, ...ctx.goals].slice(0, 4),
      rationale: {
        why: channelRationaleFor(ctx, channel, copy),
        planActivityReference: `${campaignRef}/${suffix}-1`,
        strategyLinks: [],
      },
      sourceReferences: [{ source: "marketing-understanding", reference: ctx.projectId }],
      confidence: "high",
      status: draftStatus,
    });
  });
}

export function simulateDemoCampaignWorkflow(
  project: MarketingProject,
  input: CreateMarketingCampaignProjectInput,
  locale: "nl" | "en" = "nl"
): DemoCampaignSimulationBundle {
  const ctx = buildCampaignContextFromCreateInput(project, input, locale);
  const copy = ctx.isSeedCampaign
    ? seedTemplateForGoal(input.primaryGoalId, project.title, locale === "nl")
    : generateSimulatedCopy(ctx);

  const stepApprovals = initialStepApprovals(ctx);
  const fullyAuto = ctx.executionMode === "fully_automatic";
  const channelsApproved = stepApprovals.channels_selected === "approved";
  const unlocked = fullyAuto && channelsApproved;

  const drafts = buildDraftsFromContext(project, ctx, copy, unlocked, fullyAuto);
  const unitStatus: WorkUnit["status"] = unlocked ? "review_ready" : "creating";
  const audience = ctx.audience || (locale === "nl" ? "Je doelgroep" : "Your audience");
  const workUnits = drafts.map((d) =>
    buildUnit(`unit-${d.id}`, project.id, project.peerId, d, unitStatus, audience)
  );

  return {
    projectId: project.id,
    campaignContext: ctx,
    drafts,
    workUnits,
    stepApprovals,
    deliverablesUnlocked: unlocked,
  };
}

export function unlockDemoDeliverables(
  drafts: readonly MarketingContentDraft[],
  workUnits: readonly WorkUnit[]
): { drafts: MarketingContentDraft[]; workUnits: WorkUnit[] } {
  return {
    drafts: drafts.map((d) => ({ ...d, status: "ready_for_review" as const })),
    workUnits: workUnits.map((u) => ({ ...u, status: "review_ready" as const })),
  };
}
