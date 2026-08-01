import {
  buildDemoDomainInput,
  DEMO_COMPANY_NAME,
  DEMO_PEER_ID,
  DEMO_PEER_NAME,
  DEMO_PEER_ROLE,
} from "@/lib/office/demo/demo-company";
import { DEMO_VISION_ROSTER } from "@/lib/office/vision-roster";
import { officeHref } from "@/lib/office/links";
import { buildHomeViewModel } from "@/lib/home/build-home-view-model";
import { adaptHandoffState } from "@/lib/home/adapt-handoff-state";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import type { HomePeerWorkspaceSnapshot } from "@/lib/home/types";
import type { PeerRow } from "@/lib/peer-display";
import { getHomeCopy, resolveHomeLocale } from "@/lib/i18n";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

function demoPeers(): PeerRow[] {
  return [
    {
      id: DEMO_PEER_ID,
      name: DEMO_PEER_NAME,
      role: DEMO_PEER_ROLE,
      website: "",
      objective: "",
      status: "active",
      organization_id: "demo-org",
    },
    {
      id: "sales-demo",
      name: "Sam",
      role: "Sales",
      website: "",
      objective: "",
      status: "active",
      organization_id: "demo-org",
    },
    {
      id: "support-demo",
      name: "Lisa",
      role: "Support",
      website: "",
      objective: "",
      status: "active",
      organization_id: "demo-org",
    },
  ];
}

function snapshotFromDomain(
  domainInput: MarketingPeerDomainInput,
  peer: PeerRow
): HomePeerWorkspaceSnapshot {
  return {
    peer,
    workspace: {
      projects: domainInput.projects,
      workUnits: domainInput.workUnits,
      drafts: domainInput.drafts,
      activityFeed: domainInput.activityFeed ?? [],
    },
  };
}

export function buildDemoHomeState(input?: {
  firstName?: string;
  now?: Date;
}): HandoffHomeState {
  const locale = resolveHomeLocale(null);
  const copy = getHomeCopy(locale);
  const now = input?.now ?? new Date();
  const domainInput = buildDemoDomainInput({ now, userName: input?.firstName ?? "daar" });
  const peers = demoPeers();
  const marketingPeer = peers.find((p) => p.id === DEMO_PEER_ID)!;
  const snapshots = [snapshotFromDomain(domainInput, marketingPeer)];

  const viewModel = buildHomeViewModel({
    firstName: input?.firstName,
    companyName: DEMO_COMPANY_NAME,
    peers,
    marketingSnapshots: snapshots,
    understanding: domainInput.understanding,
    lastVisitAt: null,
    locale,
  });

  const handoff =
    adaptHandoffState({
      firstName: input?.firstName,
      peers,
      marketingSnapshots: snapshots,
      understanding: domainInput.understanding,
      viewModel,
      locale,
    }) ?? null;

  return {
    pageState: "success",
    errorMessage: "",
    handoff,
    viewModel,
    marketingSnapshots: snapshots,
    canonicalPeers: peers,
    copy,
    retry: () => undefined,
    previewBanner: locale === "nl" ? "Demo — Veldwerk" : "Demo — Veldwerk",
    inboxCount: viewModel.needsYou.length,
  };
}

export { DEMO_VISION_ROSTER, officeHref };
