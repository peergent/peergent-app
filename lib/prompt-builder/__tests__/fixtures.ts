import type { ContextBundle } from "@/lib/context-engine/types";
import type { BrainSnapshot } from "@/lib/context-engine/adapters/brain/business-brain-adapter";

const BASE_BRAIN: BrainSnapshot = {
  available: true,
  companySummary: "Acme helps mid-market teams automate inbound qualification.",
  industry: "Professional Services",
  products: [],
  services: ["Implementation support", "Customer onboarding"],
  targetCustomers: "B2B operations leaders",
  valueProposition: "Consultative and trust-oriented",
  toneOfVoice: "Consultative and trust-oriented",
  strengths: ["Clear service positioning", "Strong contact path"],
  weaknesses: ["Limited self-service content"],
  opportunities: ["Lead qualification", "After-hours capture"],
  recommendations: ["Alex (Sales): Qualify inbound leads faster"],
  confidenceScore: 58,
  lastAnalyzedAt: "2026-07-18T10:00:00.000Z",
};

export function createTestBundle(
  overrides: Partial<{
    role: ContextBundle["scope"]["peer"]["role"];
    peerName: string;
    objective: string;
    brain: BrainSnapshot | null;
    includeTelemetry: boolean;
    includeKnowledge: boolean;
  }> = {}
): ContextBundle {
  const brain = overrides.brain === null ? undefined : overrides.brain ?? BASE_BRAIN;

  return {
    scope: {
      organization: {
        organizationId: "org-test-123",
        organizationName: "Acme Workspace",
        slug: "acme-workspace",
      },
      peer: {
        peerId: "peer-test-456",
        role: overrides.role ?? "Sales",
        name: overrides.peerName ?? "Jordan",
        objective: overrides.objective ?? "Qualify inbound leads",
        website: "https://acme.example",
        status: "active",
      },
      actor: {
        userId: "user-test-789",
        membershipRole: "owner",
      },
      sessionId: "session-test-trace",
      requestedAt: "2026-07-18T10:00:00.000Z",
    },
    layers: {
      identity: {
        key: "identity",
        data: {
          name: overrides.peerName ?? "Jordan",
          role: overrides.role ?? "Sales",
          roleFocus: overrides.role ?? "Sales",
          workingStyle: [],
        },
        sources: [{ id: "stub:identity", type: "derived", label: "identity", fetchedAt: "2026-07-18T10:00:00.000Z", freshness: "cached" }],
        priority: 10,
        loadMode: "eager",
      },
      organization: {
        key: "organization",
        data: {
          name: "Acme Workspace",
          slug: "acme-workspace",
          primaryWebsite: "https://acme.example",
        },
        sources: [{ id: "organizations:org-test-123", type: "supabase", label: "Acme", fetchedAt: "2026-07-18T10:00:00.000Z", freshness: "live" }],
        priority: 20,
        loadMode: "eager",
      },
      objective: {
        key: "objective",
        data: {
          objective: overrides.objective ?? "Qualify inbound leads",
        },
        sources: [{ id: "peers:peer-test-456", type: "supabase", label: "objective", fetchedAt: "2026-07-18T10:00:00.000Z", freshness: "live" }],
        priority: 30,
        loadMode: "eager",
      },
      policy: {
        key: "policy",
        data: {
          autonomy: "collaborate",
          canActIndependently: false,
          requiresApprovalFor: ["external-send", "pricing-change"],
        },
        sources: [{ id: "stub:policy", type: "derived", label: "policy", fetchedAt: "2026-07-18T10:00:00.000Z", freshness: "cached" }],
        priority: 40,
        loadMode: "eager",
      },
      ...(brain
        ? {
            brain: {
              key: "brain",
              data: brain,
              sources: [{ id: "website_intelligence_assessments:org-test-123", type: "supabase", label: "brain", fetchedAt: "2026-07-18T10:00:00.000Z", freshness: "live" }],
              priority: 70,
              loadMode: "lazy",
            },
          }
        : {}),
      ...(overrides.includeTelemetry
        ? {
            telemetry: {
              key: "telemetry",
              data: { traceId: "session-test-trace" },
              sources: [{ id: "stub:telemetry", type: "derived", label: "telemetry", fetchedAt: "2026-07-18T10:00:00.000Z", freshness: "cached" }],
              priority: 5,
              loadMode: "eager",
            },
          }
        : {}),
      ...(overrides.includeKnowledge
        ? {
            knowledge: {
              key: "knowledge",
              data: { domains: [], documents: [] },
              sources: [{ id: "stub:knowledge", type: "derived", label: "knowledge", fetchedAt: "2026-07-18T10:00:00.000Z", freshness: "cached" }],
              priority: 50,
              loadMode: "lazy",
            },
          }
        : {}),
    },
    meta: {
      completeness: 70,
      missingLayers: brain ? ["knowledge"] : ["brain", "knowledge"],
      pendingLazyLayers: brain ? ["knowledge"] : ["brain", "knowledge"],
      traceId: "session-test-trace",
    },
  };
}

export function createMarketingBundle(): ContextBundle {
  return createTestBundle({
    role: "Marketing",
    peerName: "Morgan",
    objective: "Create LinkedIn campaign messaging",
    brain: {
      ...BASE_BRAIN,
      products: ["Analytics platform"],
      opportunities: ["Content-led demand", "Audience expansion"],
    },
  });
}
