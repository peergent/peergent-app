"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { PgOfficeShell } from "@/components/design-system";
import DeskView from "@/features/office/desk/DeskView";
import WorkView from "@/features/office/work/WorkView";
import PerformanceView from "@/features/office/performance/PerformanceView";
import ContentView from "@/features/office/content/ContentView";
import MarketView from "@/features/office/market/MarketView";
import AgreementView from "@/features/office/agreement/AgreementView";
import { buildDemoDomainInput, DEMO_PEER_NAME, DEMO_PEER_ROLE } from "@/lib/office/demo/demo-company";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildMarketingDeskBriefing } from "@/lib/office/desk/build-marketing-briefing";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";
import { buildMarketingMarketViewModel } from "@/lib/office/market/build-marketing-market";
import { buildMarketingAgreementViewModel } from "@/lib/office/agreement/build-marketing-agreement";
import {
  getDemoResponsibilities,
  getDemoResponsibilitiesServerSnapshot,
  isDemoWorkspaceModified,
  resetDemoWorkspace,
  setDemoResponsibilities,
  subscribeDemoWorkspace,
} from "@/lib/office/demo/demo-workspace-state";
import { DEMO_PEER_ID } from "@/lib/office/demo/demo-company";
import type { AgreementSaveState, BoundaryKind } from "@/lib/office/agreement/types";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { OfficeDestinationId } from "@/lib/office/destinations";
import type { DeskViewModel } from "@/lib/office/desk/types";
import type { WorkViewModel } from "@/lib/office/work/types";
import type { DeskBriefing } from "@/lib/office/desk/briefing-types";
import type { PerformanceViewModel } from "@/lib/office/performance/types";
import { buildPerformanceSections } from "@/lib/office/performance/sections";

/**
 * Local-only render harness for the Office shell, Desk and Work.
 *
 * The Office routes sit behind auth, which makes visual iteration impossible
 * without a session. `/dev/*` is the project's existing development-only
 * bypass, so this renders the real components against fixed sample state.
 *
 * Nothing here ships: the fixtures exist so the composition can be judged in a
 * browser, including the states that are hardest to reach on demand.
 */

const PEER = { id: "preview", name: "Emma", role: "Marketing" };

const deskCopy: DeskViewModel["copy"] = {
  decisionsHeading: (count) =>
    count === 1 ? "Waiting for you" : `Waiting for you — ${count}`,
  inFlightHeading: "What I'm working on",
  completedHeading: "Since you were last here",
  viewAllCompleted: "View all",
  askPlaceholderName: "Emma",
  askPlaceholder: "Ask Emma about your marketing\u2026",
  rightNowHeading: "Right now",
  openCampaign: "Open campaign",
};

const deskBase: DeskViewModel = {
  peerId: PEER.id,
  peerName: PEER.name,
  peerRole: PEER.role,
  presence: {
    rung: "observation",
    text: "I'm drafting the launch email. Nothing needs you right now.",
    timeLabel: "20m ago",
    working: true,
  },
  decisions: [],
  inFlight: [],
  completed: [],
  autonomyRequest: null,
  empty: null,
  copy: deskCopy,
};

/** The quiet day — the state the customer sees most often. */
const deskCalm: DeskViewModel = {
  ...deskBase,
  inFlight: [
    {
      id: "focus",
      what: "Writing the launch email for the summer campaign",
      nextStep: "Bringing it to you for approval once the copy settles",
      expected: "Expected 2 Aug",
      href: "/office/preview/work",
    },
  ],
  completed: [
    { id: "c1", label: "Published the LinkedIn post about onboarding", context: null, timeLabel: "2h ago", href: null },
    { id: "c2", label: "Approved the summer campaign strategy", context: null, timeLabel: "Yesterday", href: null },
    { id: "c3", label: "Drafted three ad variants for review", context: null, timeLabel: "Yesterday", href: null },
  ],
  empty: {
    voice: "Nothing needs you right now.",
    next: "The launch email goes out Thursday — I'll come find you if that changes.",
  },
};

/** Day one — nothing has happened yet. */
const deskDayOne: DeskViewModel = {
  ...deskBase,
  presence: {
    rung: "orientation",
    text: "I've read your site and I know where I'd start.",
    timeLabel: "Just now",
    working: false,
  },
  empty: {
    voice: "Nothing is running yet.",
    next: "Say the word and I'll draft the first campaign.",
  },
};

/** The busy day. */
const deskBusy: DeskViewModel = {
  ...deskBase,
  presence: {
    rung: "interpretation",
    text: "Two things are waiting on your go-ahead before the campaign can move.",
    timeLabel: "5m ago",
    working: false,
    href: "/office/preview",
  },
  decisions: [
    {
      id: "d1",
      title: "Approve the launch email",
      unblocks: "The whole summer campaign is waiting on this one decision.",
      primaryLabel: "Review",
      href: "/office/preview/content?state=awaiting_review",
      ageLabel: "2 days",
    },
    {
      id: "d2",
      title: "Approve three LinkedIn posts",
      unblocks: "These go out Thursday if you approve today.",
      primaryLabel: "Review",
      href: "/office/preview/content?state=awaiting_review",
      ageLabel: "4h",
    },
  ],
  inFlight: deskCalm.inFlight,
  completed: deskCalm.completed.slice(0, 2),
};

const briefingCopy: DeskBriefing["copy"] = {
  briefingHeading: "Where things stand",
  nextStepHeading: "What I'd do next",
  whyLabel: "Why",
  changesHeading: "Since you were last here",
  futureHeading: "What appears here",
  openLabel: (destination) => `Open ${destination}`,
};

const emptyExecutive: DeskBriefing["executive"] = {
  primaryKpi: null,
  secondaryKpis: [],
  interpretation: null,
  interpretationFact: null,
  recommendation: null,
  periodLabel: null,
};

const emptySpotlight: DeskBriefing["spotlight"] = {
  activeWork: null,
  contentPreviews: [],
  marketHeadline: null,
  marketRecommendation: null,
  marketHref: null,
};

/** A workspace with real history: every panel has something to report. */
const briefingLived: DeskBriefing = {
  rung: "observation",
  kpis: [
    { id: "reach", label: "Bereik", value: "18.420", delta: { direction: "up", label: "+18%", upIsGood: true }, methodology: "Gerapporteerd door een gekoppelde bron.", emphasis: "outcome" },
    { id: "leads", label: "Leads", value: "63", delta: { direction: "up", label: "+12%", upIsGood: true }, methodology: "Gerapporteerd door een gekoppelde bron.", emphasis: "outcome" },
    { id: "published", label: "Gepubliceerd", value: "6", delta: null, methodology: "Geteld op basis van wat er live ging.", emphasis: "activity" },
  ],
  executive: {
    primaryKpi: { id: "reach", label: "Bereik", value: "18.420", delta: { direction: "up", label: "+18%", upIsGood: true }, methodology: "Gerapporteerd door een gekoppelde bron.", emphasis: "outcome" },
    secondaryKpis: [
      { id: "leads", label: "Leads", value: "63", delta: { direction: "up", label: "+12%", upIsGood: true }, methodology: "Gerapporteerd door een gekoppelde bron.", emphasis: "outcome" },
    ],
    interpretation: "LinkedIn is carrying the reach; email is not pulling its weight yet.",
    interpretationFact: "Based on connected channel reporting for the last 30 days.",
    recommendation: "Connect Google Analytics to close the loop on site conversions.",
    periodLabel: "Last 30 days",
  },
  spotlight: {
    activeWork: {
      id: "camp-summer",
      title: "Summer product launch",
      stageLabel: "Awaiting review",
      nextStep: "Review the launch email draft",
      href: "/office/preview/work",
      blockedBy: "Your approval on the email",
      progressPct: 72,
    },
    contentPreviews: [
      {
        id: "preview-1",
        title: "Launch email — first draft",
        channelId: "email",
        channelLabel: "Newsletter",
        statusLabel: "Awaiting review",
        state: "awaiting_review",
        preview: "We help installers plan their week in minutes, not hours.",
        meta: "Summer launch · Today",
        href: "/office/preview/content",
        performance: null,
      },
    ],
    marketHeadline: "Two competitors lead on price; neither says anything about onboarding.",
    marketRecommendation: "Lead with onboarding speed in the next campaign.",
    marketHref: "/office/preview/market",
  },
  focus: {
    source: "preparing",
    eyebrow: "What I'm working on",
    headline: "Writing the launch email for the summer campaign",
    detail: "Bringing it to you for approval once the copy settles",
    subjectId: "focus",
    href: "/office/preview/work",
    ctaLabel: "Open campaign",
    meta: "Expected 2 Aug",
  },
  panels: [
    {
      id: "work",
      eyebrow: "Work",
      headline: "Two campaigns are running; the launch is the one that moves first.",
      stats: [
        { id: "b", label: "Waiting on you", value: "1", hint: "Summer product launch", tone: "attention" },
        { id: "m", label: "Moving", value: "1", hint: "Autumn awareness push", tone: "neutral" },
      ],
      future: null,
      href: "/office/preview/work",
      openLabel: "Open Work",
    },
    {
      id: "performance",
      eyebrow: "Performance",
      headline: "LinkedIn is carrying the reach; email is not pulling its weight yet.",
      stats: [
        { id: "r", label: "Reach", value: "4,120", hint: "vs 3,480 last period", tone: "positive" },
        { id: "l", label: "Leads", value: "37", hint: "counted from forms", tone: "neutral" },
      ],
      future: null,
      href: "/office/preview/performance",
      openLabel: "Open Performance",
    },
    {
      id: "content",
      eyebrow: "Content",
      headline: "Eleven pieces live; three are waiting on a read from you.",
      stats: [
        { id: "a", label: "Awaiting review", value: "3", hint: null, tone: "attention" },
        { id: "s", label: "Scheduled", value: "2", hint: "Thursday", tone: "neutral" },
        { id: "p", label: "Published", value: "11", hint: null, tone: "neutral" },
      ],
      future: null,
      href: "/office/preview/content",
      openLabel: "Open Content",
    },
    {
      id: "market",
      eyebrow: "Market",
      headline: "Two competitors lead on price; neither of them says anything about onboarding.",
      stats: [
        { id: "c", label: "Competitors", value: "3", hint: "Northbeam", tone: "neutral" },
        { id: "o", label: "Observed", value: "8", hint: null, tone: "quiet" },
      ],
      future: null,
      href: "/office/preview/market",
      openLabel: "Open Market",
    },
    {
      id: "agreement",
      eyebrow: "Working agreement",
      headline: "I publish to LinkedIn on my own; everything else comes back to you.",
      stats: [
        { id: "au", label: "On my own", value: "2", hint: null, tone: "neutral" },
        { id: "ap", label: "Needs approval", value: "5", hint: null, tone: "neutral" },
        { id: "cn", label: "Connected", value: "1/3", hint: "Google Analytics", tone: "attention" },
      ],
      future: null,
      href: "/office/preview/agreement",
      openLabel: "Open Working agreement",
    },
  ],
  nextStep: {
    label: "Connect Google Analytics",
    why: "It is the only thing standing between the campaigns and a real read on what they returned.",
    ctaLabel: "Connect it",
    href: "/office/preview/agreement",
    origin: "agreement",
  },
  changes: [
    { id: "c1", label: "Published the LinkedIn post about onboarding", context: null, timeLabel: "2h ago", href: null },
    { id: "c2", label: "Approved the summer campaign strategy", context: null, timeLabel: "Yesterday", href: null },
    { id: "c3", label: "Drafted three ad variants for review", context: null, timeLabel: "Yesterday", href: null },
  ],
  copy: briefingCopy,
};

/** Day one: nothing has happened yet, and every panel has to earn its place. */
const briefingEarly: DeskBriefing = {
  rung: "orientation",
  kpis: [],
  executive: emptyExecutive,
  spotlight: emptySpotlight,
  focus: {
    source: "recommendation",
    eyebrow: "Where I'd start",
    headline: "I'd start with a LinkedIn campaign aimed at Dutch SME founders.",
    detail: "It's the fastest way to find out whether the message lands before we go wider.",
    subjectId: null,
    href: null,
    ctaLabel: null,
    meta: "your audience: Dutch SME founders",
  },
  panels: [
    {
      id: "work",
      eyebrow: "Work",
      headline: "Nothing started yet.",
      stats: [],
      future: {
        promise: "Every campaign in flight, and who it is waiting on.",
        unlocks: "Say yes to the LinkedIn campaign and it appears here as it moves.",
        ctaLabel: "Draft it",
        ctaHref: "/office/preview/work",
      },
      href: "/office/preview/work",
      openLabel: "Open Work",
    },
    {
      id: "performance",
      eyebrow: "Performance",
      headline: "I can count what I publish, but nothing reports back on it yet.",
      stats: [],
      future: {
        promise: "Reach, leads and which channel actually returned them.",
        unlocks: "No analytics source is connected.",
        ctaLabel: "Connect a source",
        ctaHref: "/office/preview/agreement",
      },
      href: "/office/preview/performance",
      openLabel: "Open Performance",
    },
    {
      id: "content",
      eyebrow: "Content",
      headline: "I haven't written anything yet.",
      stats: [],
      future: {
        promise: "Everything I write, from draft to published.",
        unlocks: "The first campaign produces the first drafts.",
        ctaLabel: null,
        ctaHref: null,
      },
      href: "/office/preview/content",
      openLabel: "Open Content",
    },
    {
      id: "market",
      eyebrow: "Market",
      headline: "I don't know who you're up against yet.",
      stats: [],
      future: {
        promise: "What your competitors are doing, and what it means for your position.",
        unlocks: "Name two competitors and I can start comparing.",
        ctaLabel: "Add a competitor",
        ctaHref: "/office/preview/agreement",
      },
      href: "/office/preview/market",
      openLabel: "Open Market",
    },
    {
      id: "agreement",
      eyebrow: "Working agreement",
      headline: "Everything comes back to you for approval, for now.",
      stats: [
        { id: "ap", label: "Needs approval", value: "5", hint: null, tone: "neutral" },
        { id: "cn", label: "Connected", value: "0/3", hint: "Google Analytics", tone: "attention" },
      ],
      future: null,
      href: "/office/preview/agreement",
      openLabel: "Open Working agreement",
    },
  ],
  nextStep: {
    label: "I'd start with a LinkedIn campaign aimed at Dutch SME founders.",
    why: "It is the fastest way to find out whether the message lands before we go wider.",
    ctaLabel: "Draft it",
    href: "/office/preview/work",
    origin: "work",
  },
  changes: [],
  copy: briefingCopy,
};

const workCopy: WorkViewModel["copy"] = {
  title: "Work",
  createLabel: "New campaign",
  nextStepLabel: "Next",
  blockedLabel: "Held up by",
  notConnectedLabel: (channel) => `${channel} isn't connected yet`,
  showFinished: "Show finished work",
  hideFinished: "Hide finished work",
  whereIdStart: "Where I\u2019d start",
  basedOnPrefix: "Based on",
  startingOnPrefix: "starting on",
};

/** Work with nothing in it — the state that currently reads as a placeholder. */
const workEmpty: WorkViewModel = {
  peerId: PEER.id,
  peerName: PEER.name,
  peerRole: PEER.role,
  presence: null,
  groups: [],
  proposal: {
    voice: "I'd start with a LinkedIn campaign aimed at Dutch SME founders.",
    next: "It's the fastest way to find out whether the message lands before we go wider.",
    acceptLabel: "Draft it",
    briefLabel: "I'd rather brief you myself",
    basedOn: "your audience: Dutch SME founders",
    channel: "LinkedIn",
    stagesHeading: "How a campaign runs",
    terms: {
      heading: "What I'm proposing",
      items: [
        { id: "objective", label: "What it's for", value: "Get founders who already feel the problem to book a call." },
        { id: "why", label: "Why this one", value: "Your site argues about onboarding time, and no competitor is making that argument." },
        { id: "audience", label: "Who it's for", value: "Dutch SME founders" },
        { id: "channels", label: "Where", value: "LinkedIn · Email" },
        { id: "effort", label: "What it asks of you", value: "One go-ahead, before anything goes out." },
      ],
    },
    stages: [
      { id: "plan", label: "Approach", description: "I work out the angle and who it's for.", needsYou: false },
      { id: "create", label: "Make", description: "I write the content and put the visuals together.", needsYou: false },
      { id: "review", label: "Your go-ahead", description: "You see everything before any of it goes out.", needsYou: true },
      { id: "publish", label: "Live", description: "I publish at the time we agreed.", needsYou: false },
      { id: "watch", label: "Watch", description: "I track how it lands and tell you if it's worth knowing.", needsYou: false },
    ],
  },
  copy: workCopy,
};

const workFull: WorkViewModel = {
  ...workEmpty,
  proposal: null,
  groups: [
    {
      id: "blocked_on_you",
      title: "Waiting on you",
      collapsedByDefault: false,
      items: [
        {
          id: "p1",
          name: "Summer product launch",
          stageLabel: "Waiting for review",
          nextStep: "Waiting for your go-ahead",
          blockedBy: "you",
          expectedLabel: "Expected 2 Aug",
          href: "/office/preview/work?campaign=p1",
          channels: [
            { id: "linkedin", label: "LinkedIn", connected: true },
            { id: "email", label: "Email", connected: true },
          ],
        },
      ],
    },
    {
      id: "moving",
      title: "Moving",
      collapsedByDefault: false,
      items: [
        {
          id: "p2",
          name: "Autumn awareness push",
          stageLabel: "Preparing",
          nextStep: "Writing the content",
          blockedBy: null,
          expectedLabel: "Expected 14 Aug",
          href: "/office/preview/work?campaign=p2",
          channels: [{ id: "instagram", label: "Instagram", connected: false }],
        },
      ],
    },
  ],
};

type Scene =
  | "desk-calm"
  | "desk-busy"
  | "desk-day-one"
  | "work-empty"
  | "work-full"
  | "performance-early"
  | "demo-desk"
  | "demo-work"
  | "demo-performance"
  | "demo-content"
  | "demo-market"
  | "demo-agreement";

/**
 * Performance before any source reports — the state that has to teach rather
 * than apologise. Counted metrics exist because publishing is observable; the
 * channel-reported measurements do not, and appear as empty frames.
 */
const performanceEarly: PerformanceViewModel = {
  peerId: PEER.id,
  peerName: PEER.name,
  peerRole: PEER.role,
  presence: {
    rung: "qualified",
    text: "I can count what I publish, but nothing reports back on it yet.",
    timeLabel: "Just now",
  },
  filters: { period: "30d", campaignId: null, channel: null, contentType: null },
  filterGroups: [],
  metrics: [
    {
      id: "published",
      label: "Published",
      value: "11",
      comparison: { direction: "up", label: "vs 7 previous period" },
      methodology: "Counted from what actually went live.",
      source: "counted",
    },
    {
      id: "campaigns-completed",
      label: "Campaigns completed",
      value: "2",
      comparison: null,
      methodology: "Counted from campaigns that reached their final stage.",
      source: "counted",
    },
  ],
  trend: null,
  cuts: [],
  // A live-shaped workspace with nothing connected. Built through the real
  // section builder rather than hand-rolled, so the harness cannot show a
  // shape the product would not produce.
  sections: buildPerformanceSections({
    peerId: PEER.id,
    locale: "en",
    connections: [],
    storedMetrics: [],
    countedMetrics: {},
    agreementHref: "/office/preview/agreement",
  }),
  executive: [],
  providerCards: [],
  gaps: [
    {
      id: "reach",
      missing: "Reach",
      unlocks: "how many people your campaigns reached",
      ctaLabel: "Connect",
      ctaHref: "/office/preview/agreement",
    },
    {
      id: "leads",
      missing: "Leads",
      unlocks: "which leads came out of them",
      ctaLabel: "Connect",
      ctaHref: "/office/preview/agreement",
    },
    {
      id: "revenue",
      missing: "Revenue influenced",
      unlocks: "what your campaigns returned",
      ctaLabel: "Connect",
      ctaHref: "/office/preview/agreement",
    },
  ],
  signals: [],
  copy: {
    title: "Performance",
    subtitle: "See for yourself how your marketing is doing.",
    periodLabel: "Period",
    campaignLabel: "Campaign",
    channelLabel: "Channel",
    contentTypeLabel: "Type",
    allLabel: "All",
    gapsHeading: "What I can't see yet",
    trendHeading: "Over time",
    methodologyPrefix: "Counted from",
    observedHeading: "Measured",
    connectLabel: "Connect",
    futureHeading: "What I'll be able to show",
    notReportedYet: "No source reports this yet.",
    trendFuture:
      "How this moves over time, once enough has gone live to draw a line.",
    willShow: (what) => `This is where I show you ${what}.`,
  },
};

const demoInput = buildDemoDomainInput({ locale: "nl" });
const demoBase = {
  domainInput: demoInput,
  peerName: DEMO_PEER_NAME,
  peerRole: DEMO_PEER_ROLE,
  localePreference: "nl",
};
function buildDemoModels(responsibilities: MarketingResponsibility[]) {
  const scoped = {
    ...demoBase,
    domainInput: { ...demoInput, responsibilities },
  };
  const desk = buildMarketingDeskViewModel(scoped);
  return {
    desk,
    briefing: buildMarketingDeskBriefing({ ...scoped, desk }),
    work: buildMarketingWorkViewModel(scoped),
    performance: buildMarketingPerformanceViewModelForOffice(scoped),
    content: buildMarketingContentViewModel(scoped),
    market: buildMarketingMarketViewModel(scoped),
    agreement: buildMarketingAgreementViewModel(scoped),
  };
}

function useDemoModels() {
  const responsibilities = useSyncExternalStore(
    subscribeDemoWorkspace,
    getDemoResponsibilities,
    getDemoResponsibilitiesServerSnapshot
  );
  return useMemo(() => buildDemoModels(responsibilities), [responsibilities]);
}

/** Static snapshot for the scene list and the shell's presence lookup. */
const demo = buildDemoModels(demoInput.responsibilities);

const DEMO_SCENES: { id: Scene; label: string; destination: OfficeDestinationId }[] = [
  { id: "demo-desk", label: "Demo · Desk", destination: "desk" },
  { id: "demo-work", label: "Demo · Work", destination: "work" },
  { id: "demo-performance", label: "Demo · Performance", destination: "performance" },
  { id: "demo-content", label: "Demo · Content", destination: "content" },
  { id: "demo-market", label: "Demo · Market", destination: "market" },
  { id: "demo-agreement", label: "Demo · Agreement", destination: "agreement" },
];

function demoPresenceFor(destination: OfficeDestinationId) {
  switch (destination) {
    case "work":
      // Mirrors the real route: Work has no presence of its own, so the shell
      // shows her Desk state rather than an empty rail block.
      return demo.desk.presence;
    case "performance":
      return demo.performance.presence;
    case "content":
      return demo.content.presence;
    case "market":
      return demo.market.presence;
    case "agreement":
      return demo.agreement.presence;
    default:
      return demo.desk.presence;
  }
}


/**
 * The interactive demo agreement, wired to the in-memory store so a change can
 * be made here and seen to survive a move to another destination.
 */
function DemoAgreementScene() {
  const responsibilities = useSyncExternalStore(
    subscribeDemoWorkspace,
    getDemoResponsibilities,
    getDemoResponsibilitiesServerSnapshot
  );
  const [saveState, setSaveState] = useState<AgreementSaveState>({ status: "idle" });
  const [pending, setPending] = useState<{ id: string; next: BoundaryKind } | null>(null);

  const model = useDemoModels().agreement;

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--pg-radius-sm)] border border-dashed border-[var(--pg-office-line-strong)] px-4 py-3"
        data-testid="demo-agreement-notice"
      >
        <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-[var(--pg-color-text-secondary)]">
          Demo-werkruimte. Je kunt grenzen hier gerust verzetten — het werkt
          precies zoals in het echt, maar er wordt niets opgeslagen.
        </p>
        {isDemoWorkspaceModified() ? (
          <button
            type="button"
            onClick={resetDemoWorkspace}
            className="pg-focus-premium shrink-0 text-[12.5px] text-[var(--pg-color-accent)]"
            data-testid="demo-reset"
          >
            Zet de demo terug
          </button>
        ) : null}
      </div>
      <AgreementView
        model={model}
        saveState={saveState}
        onChangeBoundary={(boundaryId, next) => {
          const boundary = [
            ...model.autonomous,
            ...model.needsApproval,
            ...model.never,
          ].find((b) => b.id === boundaryId);
          if (!boundary) return;
          setPending({ id: boundaryId, next });
          setSaveState({
            status: "confirming",
            boundaryId,
            consequence: boundary.consequence,
          });
        }}
        onConfirm={(boundaryId) => {
          if (!pending || pending.id !== boundaryId) return;
          setSaveState({ status: "saving", boundaryId });
          setDemoResponsibilities(
            DEMO_PEER_ID,
            responsibilities.map((r) =>
              r.id === boundaryId
                ? {
                    ...r,
                    enabled: pending.next !== "never",
                    status: pending.next === "never" ? ("disabled" as const) : ("enabled" as const),
                    approvalPolicy:
                      pending.next === "autonomous"
                        ? ("fully_automatic" as const)
                        : ("approval_required" as const),
                    autonomyLevel:
                      pending.next === "autonomous"
                        ? ("autonomous" as const)
                        : ("semi_autonomous" as const),
                    updatedAt: new Date().toISOString(),
                  }
                : r
            )
          );
          setSaveState({ status: "saved", boundaryId });
          setPending(null);
        }}
        onCancel={() => {
          setPending(null);
          setSaveState({ status: "idle" });
        }}
      />
    </>
  );
}

function DemoScene({ destination }: { destination: OfficeDestinationId }) {
  const models = useDemoModels();

  switch (destination) {
    case "work":
      return <WorkView model={models.work} />;
    case "performance":
      return <PerformanceView model={models.performance} />;
    case "content":
      return <ContentView model={models.content} />;
    case "market":
      return <MarketView model={models.market} />;
    case "agreement":
      return <DemoAgreementScene />;
    default:
      return (
        <DeskView
          model={models.desk}
          briefing={models.briefing}
          onAsk={() => undefined}
        />
      );
  }
}

const SCENES: { id: Scene; label: string }[] = [
  { id: "desk-calm", label: "Desk · quiet day" },
  { id: "desk-busy", label: "Desk · decisions waiting" },
  { id: "desk-day-one", label: "Desk · day one" },
  { id: "work-empty", label: "Work · nothing yet" },
  { id: "work-full", label: "Work · in flight" },
  { id: "performance-early", label: "Performance · nothing reporting" },
  ...DEMO_SCENES,
];

export default function OfficePreviewPage() {
  const [scene, setScene] = useState<Scene>("desk-calm");
  const isDesk = scene.startsWith("desk");
  const isPerformance = scene.startsWith("performance");
  const demoScene = DEMO_SCENES.find((entry) => entry.id === scene) ?? null;
  const deskModel =
    scene === "desk-busy" ? deskBusy : scene === "desk-day-one" ? deskDayOne : deskCalm;
  const deskBriefing = scene === "desk-day-one" ? briefingEarly : briefingLived;

  return (
    <div
      className="-mx-5 -my-8 flex h-screen flex-col md:-mx-8"
      style={{ ["--pg-shell-min-h" as string]: "0px" }}
    >
      <div className="flex shrink-0 flex-wrap gap-2 px-5 py-3 md:px-8">
        {SCENES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setScene(option.id)}
            className={`rounded-md px-3 py-1.5 text-xs ${
              scene === option.id
                ? "bg-white/15 text-white"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <PgOfficeShell
        peerId={PEER.id}
        peerName={PEER.name}
        peerRole={PEER.role}
        team={[]}
        active={
          demoScene
            ? demoScene.destination
            : isDesk
              ? "desk"
              : isPerformance
                ? "performance"
                : "work"
        }
        presence={
          demoScene
            ? demoPresenceFor(demoScene.destination)
            : isDesk
              ? deskModel.presence
              : isPerformance
                ? performanceEarly.presence
                : deskCalm.presence
        }
        decisionCount={
          demoScene ? demo.desk.decisions.length : isDesk ? deskModel.decisions.length : 0
        }
        isDemo={demoScene !== null}
        locale={demoScene ? "nl" : undefined}
        onBrief={() => undefined}
        onSearch={() => undefined}
      >
        {demoScene ? (
          <DemoScene destination={demoScene.destination} />
        ) : isDesk ? (
          <DeskView
            model={deskModel}
            briefing={deskBriefing}
            onAsk={() => undefined}
          />
        ) : isPerformance ? (
          <PerformanceView model={performanceEarly} />
        ) : (
          <WorkView
            model={scene === "work-empty" ? workEmpty : workFull}
            onCreate={() => undefined}
            onAcceptProposal={() => undefined}
            onBriefInstead={() => undefined}
          />
        )}
      </PgOfficeShell>
    </div>
  );
}
