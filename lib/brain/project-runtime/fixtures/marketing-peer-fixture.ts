/**
 * Deterministic B2B marketing project fixture for end-to-end integration tests.
 */

import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  collectBrandGraph,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { PerformanceObservation } from "../../layers/learning/brain-types";
import type { BrainContextSlices } from "../../project-engine/brain-contract";

export const FIXTURE_ORG_ID = PEERGENT_DEMO_ORG_ID;

export const FIXTURE_PEER_INPUT = {
  peerId: "demo" as const,
  ownerLabel: "Emma",
  name: "LeadFlow Services",
  goalLabel: "Qualified leads",
  description: "Generate qualified B2B service leads from SMB owners.",
  primaryGoalId: "generate_leads" as const,
  targetAudience: "SMB owners",
  setupMode: "automatic" as const,
  approvalMode: "approval_before_publication" as const,
  selectedChannels: ["linkedin", "google_ads"] as const,
};

export function buildMarketingPeerFixture(projectSuffix = "1") {
  clearDemoWebsiteSnapshots();
  seedPeergentDemoWebsiteSnapshotSync();
  const assembledAt = "2026-08-01T00:00:00.000Z";
  const profile = buildPeergentCompanyProfile("en", assembledAt);
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: FIXTURE_ORG_ID,
    url: "https://leadflow.example.com",
  });
  const project = createMarketingCampaignProject({
    ...FIXTURE_PEER_INPUT,
    name: `${FIXTURE_PEER_INPUT.name} ${projectSuffix}`,
    selectedChannels: [...FIXTURE_PEER_INPUT.selectedChannels],
  });
  const campaignContext = buildCampaignContextFromCreateInput(project, FIXTURE_PEER_INPUT, "en");
  const assembly = assembleCompanyContextSync({
    organizationId: FIXTURE_ORG_ID,
    companyProfile: profile,
    websiteSnapshot: website,
    campaignContext,
    locale: "en",
  });
  const brandGraph = collectBrandGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    upstreamOutputs: {},
  });

  const sliceAvailability: Partial<BrainContextSlices> = {
    business: true,
    brand: true,
    website: true,
    products: true,
    competitors: true,
    goals: true,
    campaign: true,
  };

  return {
    organizationId: FIXTURE_ORG_ID,
    peerId: FIXTURE_PEER_INPUT.peerId,
    project,
    campaignContext,
    companySnapshot: assembly.companySnapshot,
    brandGraph,
    sliceAvailability,
  };
}

export function buildFixturePerformanceObservations(projectId: string): PerformanceObservation[] {
  const secondaryCampaignId = `${projectId}-repeat`;
  return [
    {
      id: "perf-ctr-proof",
      organizationId: FIXTURE_ORG_ID,
      projectId,
      campaignId: projectId,
      channel: "LinkedIn",
      metric: "ctr",
      value: 5.2,
      unit: "percent",
      baseline: 3.1,
      target: 4.0,
      comparisonValue: null,
      measurementWindow: "14d",
      observedAt: "2026-08-15T00:00:00.000Z",
      source: "fixture_observation",
      sourceRef: "stub-campaign-1",
      attributionModel: "last_touch",
      attributionConfidence: "medium",
      dataQuality: "good",
      sampleSize: 1200,
      segment: "SMB owners",
      metadata: { messageTerritory: "proof-led", variant: "proof-led A" },
    },
    {
      id: "perf-ql-conversion",
      organizationId: FIXTURE_ORG_ID,
      projectId,
      campaignId: projectId,
      channel: "LinkedIn",
      metric: "qualified_lead_rate",
      value: 2.8,
      unit: "percent",
      baseline: 1.5,
      target: 2.0,
      comparisonValue: null,
      measurementWindow: "14d",
      observedAt: "2026-08-15T00:00:00.000Z",
      source: "fixture_observation",
      sourceRef: "stub-campaign-1",
      attributionModel: "last_touch",
      attributionConfidence: "medium",
      dataQuality: "good",
      sampleSize: 1200,
      segment: "SMB owners",
      metadata: { messageTerritory: "proof-led" },
    },
    {
      id: "perf-ctr-proof-repeat",
      organizationId: FIXTURE_ORG_ID,
      projectId,
      campaignId: secondaryCampaignId,
      channel: "LinkedIn",
      metric: "ctr",
      value: 4.9,
      unit: "percent",
      baseline: 3.0,
      target: 4.0,
      comparisonValue: null,
      measurementWindow: "14d",
      observedAt: "2026-08-20T00:00:00.000Z",
      source: "fixture_observation",
      sourceRef: "stub-campaign-2",
      attributionModel: "last_touch",
      attributionConfidence: "medium",
      dataQuality: "good",
      sampleSize: 980,
      segment: "SMB owners",
      metadata: { messageTerritory: "proof-led", variant: "proof-led B" },
    },
    {
      id: "perf-ql-conversion-repeat",
      organizationId: FIXTURE_ORG_ID,
      projectId,
      campaignId: secondaryCampaignId,
      channel: "LinkedIn",
      metric: "qualified_lead_rate",
      value: 2.5,
      unit: "percent",
      baseline: 1.4,
      target: 2.0,
      comparisonValue: null,
      measurementWindow: "14d",
      observedAt: "2026-08-21T00:00:00.000Z",
      source: "fixture_observation",
      sourceRef: "stub-campaign-2",
      attributionModel: "last_touch",
      attributionConfidence: "medium",
      dataQuality: "good",
      sampleSize: 850,
      segment: "SMB owners",
      metadata: { messageTerritory: "proof-led" },
    },
  ];
}

export const PROOF_LED_LEARNING_SNIPPET = "proof-led";
