"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";
import type {
  PeerWorkspaceCopy,
  PeerWorkspaceCopyTextKey,
} from "@/lib/i18n/peer-workspace-copy";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import V17KnowledgeSettingsView from "@/features/customer-v17/settings/V17KnowledgeSettingsView";
import { buildV17KnowledgeSettingsViewModel } from "@/lib/customer-v17/build-v17-knowledge-settings-view-model";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import ConnectionsTab from "../tabs/ConnectionsTab";
import ResponsibilitiesTab from "../tabs/ResponsibilitiesTab";
import SettingsTab from "../tabs/SettingsTab";

export type PeerSettingsHubProps = {
  peerId: string;
  domainInput: MarketingPeerDomainInput;
  workspace: ReturnType<typeof useMarketingWorkspace>;
  copy: PeerWorkspaceCopy;
  onAudit?: (title: string, description: string) => void;
};

const INDEX: Array<{
  id: string;
  copyKey: PeerWorkspaceCopyTextKey;
  href: (peerId: string) => string;
}> = [
  {
    id: "autonomy",
    copyKey: "settingsHowPeerWorks",
    href: (peerId) => `/team/${peerId}/settings?section=autonomy`,
  },
  {
    id: "knowledge",
    copyKey: "settingsKnowledgeBrand",
    href: (peerId) => `/team/${peerId}/settings?section=knowledge`,
  },
  {
    id: "connections",
    copyKey: "settingsConnections",
    href: (peerId) => `/team/${peerId}/settings?section=connections`,
  },
  {
    id: "responsibilities",
    copyKey: "settingsApprovalsAutonomy",
    href: (peerId) => `/team/${peerId}/settings?section=responsibilities`,
  },
  {
    id: "notifications",
    copyKey: "settingsNotifications",
    href: (peerId) => `/team/${peerId}/settings?section=notifications`,
  },
  {
    id: "advanced",
    copyKey: "settingsAdvanced",
    href: (peerId) => `/team/${peerId}/settings?section=advanced`,
  },
];

export default function PeerSettingsHub({
  peerId,
  domainInput,
  workspace,
  copy,
  onAudit,
}: PeerSettingsHubProps) {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  if (section === "knowledge") {
    const model = buildV17KnowledgeSettingsViewModel({
      domainInput,
      localePreference: customerLocalePreferenceFromEnv(),
    });
    return <V17KnowledgeSettingsView model={model} />;
  }
  if (section === "connections") {
    return <ConnectionsTab domainInput={domainInput} />;
  }
  if (section === "responsibilities") {
    return (
      <ResponsibilitiesTab
        domainInput={domainInput}
        onToggleOwnership={(id, enabled) =>
          workspace.updateResponsibilities(
            domainInput.responsibilities.map((r) =>
              r.id === id ? { ...r, enabled } : r
            )
          )
        }
        onApprovePlan={workspace.handleApproveResponsibilityPlan}
      />
    );
  }
  if (section === "autonomy" || section === "notifications" || section === "advanced") {
    return (
      <>
        <SettingsIndex peerId={peerId} copy={copy} />
        <SettingsTab peerId={peerId} workspace={workspace} onAudit={onAudit} />
      </>
    );
  }

  return <SettingsIndex peerId={peerId} copy={copy} />;
}

function SettingsIndex({
  peerId,
  copy,
}: {
  peerId: string;
  copy: PeerWorkspaceCopy;
}) {
  return (
    <section className="mw-section" data-testid="mw-settings-index">
      <ul className="mw-settings-index">
        {INDEX.map((entry) => (
          <li key={entry.id}>
            <Link href={entry.href(peerId)} className="mw-settings-index-link pg-focus-premium">
              {copy[entry.copyKey]}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
