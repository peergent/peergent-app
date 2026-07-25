"use client";

import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import SettingsTab from "@/features/marketing-workspace/tabs/SettingsTab";

export default function EmmaManagePage() {
  return (
    <MarketingPeerPageFrame activeTab="settings">
      {({ peerId, workspace }) => (
        <SettingsTab
          peerId={peerId}
          workspace={workspace}
          onAudit={(title, description) => workspace.recordWorkspaceActivity(title, description)}
        />
      )}
    </MarketingPeerPageFrame>
  );
}
