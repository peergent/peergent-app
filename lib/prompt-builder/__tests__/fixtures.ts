import type { ContextBundle } from "@/lib/context-engine/types";
import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import { assembleContextPackage } from "@/lib/context-engine/assembly/context-package";

const BASE_DNA: CompanyDnaContextSlice = {
  available: true,
  mission: "Help mid-market teams automate inbound qualification.",
  values: [{ id: "v1", name: "Trust", description: "Consultative and credible" }],
  toneOfVoice: {
    summary: "Consultative and trust-oriented",
    personality: ["Professional", "Direct"],
  },
  riskProfile: { tolerance: "balanced", summary: "Measured growth" },
  decisionPrinciples: [{ id: "p1", name: "Customer-first decisions" }],
};

const BASE_BRAIN: BusinessBrainContextSlice = {
  available: true,
  products: [],
  services: [
    {
      id: "svc-1",
      businessBrainId: "brain-1",
      name: "Implementation support",
      description: "Onboarding and setup",
      metadata: {},
      sortOrder: 0,
      createdAt: "2026-07-18T10:00:00.000Z",
      updatedAt: "2026-07-18T10:00:00.000Z",
    },
    {
      id: "svc-2",
      businessBrainId: "brain-1",
      name: "Customer onboarding",
      metadata: {},
      sortOrder: 1,
      createdAt: "2026-07-18T10:00:00.000Z",
      updatedAt: "2026-07-18T10:00:00.000Z",
    },
  ],
  customerSegments: [
    {
      id: "seg-1",
      businessBrainId: "brain-1",
      name: "B2B operations leaders",
      segments: ["Mid-market"],
      painPoints: ["Manual qualification"],
      buyingTriggers: ["Growth targets"],
      metadata: {},
      sortOrder: 0,
      createdAt: "2026-07-18T10:00:00.000Z",
      updatedAt: "2026-07-18T10:00:00.000Z",
    },
  ],
  competitors: [],
  internalProcesses: [],
  knowledgeSources: [],
  facts: [
    {
      id: "fact-1",
      businessBrainId: "brain-1",
      subject: "Company",
      predicate: "serves",
      value: "B2B operations leaders",
      confidence: "moderate",
      verified: false,
      importance: "medium",
      lastUpdated: "2026-07-18T10:00:00.000Z",
      metadata: {},
      sortOrder: 0,
      createdAt: "2026-07-18T10:00:00.000Z",
    },
  ],
};

export function createTestBundle(
  overrides: Partial<{
    role: ContextBundle["scope"]["peer"]["role"];
    peerName: string;
    objective: string;
    companyDna: CompanyDnaContextSlice | null;
    businessBrain: BusinessBrainContextSlice | null;
    includeTelemetry: boolean;
    includeKnowledge: boolean;
  }> = {}
): ContextBundle {
  const companyDna =
    overrides.companyDna === null ? undefined : overrides.companyDna ?? BASE_DNA;
  const businessBrain =
    overrides.businessBrain === null ? undefined : overrides.businessBrain ?? BASE_BRAIN;

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
      ...(companyDna
        ? {
            "company-dna": {
              key: "company-dna",
              data: companyDna,
              sources: [{ id: "company_dna:org-test-123", type: "supabase", label: "Company DNA", fetchedAt: "2026-07-18T10:00:00.000Z", freshness: "live" }],
              priority: 60,
              loadMode: "lazy",
            },
          }
        : {}),
      ...(businessBrain
        ? {
            "business-brain": {
              key: "business-brain",
              data: businessBrain,
              sources: [{ id: "business_brains:org-test-123", type: "supabase", label: "Business Brain", fetchedAt: "2026-07-18T10:00:00.000Z", freshness: "live" }],
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
      missingLayers: businessBrain ? ["knowledge"] : ["business-brain", "knowledge"],
      pendingLazyLayers: businessBrain ? ["knowledge"] : ["business-brain", "knowledge"],
      traceId: "session-test-trace",
    },
  };
}

export function createTestContextPackage(
  overrides: Parameters<typeof createTestBundle>[0] = {}
) {
  return assembleContextPackage(createTestBundle(overrides), {
    taskHint: "Review this inbound lead",
  });
}

export function createMarketingBundle(): ContextBundle {
  return createTestBundle({
    role: "Marketing",
    peerName: "Morgan",
    objective: "Create LinkedIn campaign messaging",
    businessBrain: {
      ...BASE_BRAIN,
      products: [
        {
          id: "prod-1",
          businessBrainId: "brain-1",
          name: "Analytics platform",
          metadata: {},
          sortOrder: 0,
          createdAt: "2026-07-18T10:00:00.000Z",
          updatedAt: "2026-07-18T10:00:00.000Z",
        },
      ],
    },
  });
}
