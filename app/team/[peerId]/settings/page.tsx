"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import V17SettingsView from "@/features/customer-v17/peer/V17SettingsView";
import PeerSettingsHub from "@/features/marketing-workspace/colleague/PeerSettingsHub";
import { buildV17SettingsViewModel } from "@/lib/customer-v17/build-v17-settings-view-model";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { getPeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  return (
    <MarketingPeerPageFrame activeTab="settings">
      {({ peerId, domainInput, workspace }) => {
        if (!workspace.peer) return null;
        const localePreference = customerLocalePreferenceFromEnv();
        if (section) {
          return (
            <PeerSettingsHub
              peerId={peerId}
              domainInput={domainInput}
              workspace={workspace}
              copy={getPeerWorkspaceCopy(localePreference)}
              onAudit={(title, description) =>
                workspace.recordWorkspaceActivity(title, description)
              }
            />
          );
        }
        const model = buildV17SettingsViewModel({ peerId, localePreference });
        return <V17SettingsView model={model} />;
      }}
    </MarketingPeerPageFrame>
  );
}

export default function EmmaManagePage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}
