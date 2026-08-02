"use client";

import { useSyncExternalStore } from "react";
import {
  isDemoWorkspaceModified,
  resetDemoWorkspace,
  subscribeDemoWorkspace,
} from "@/lib/office/demo/demo-workspace-state";
import { subscribeDemoCampaignStore } from "@/lib/office/demo/demo-campaign-store";

export type DemoResetControlProps = {
  locale?: string | null;
};

function subscribeDemoCombined(listener: () => void): () => void {
  const unsubWorkspace = subscribeDemoWorkspace(listener);
  const unsubCampaign = subscribeDemoCampaignStore(listener);
  return () => {
    unsubWorkspace();
    unsubCampaign();
  };
}

export default function DemoResetControl({ locale }: DemoResetControlProps) {
  const nl = locale === "nl";
  const modified = useSyncExternalStore(
    subscribeDemoCombined,
    isDemoWorkspaceModified,
    () => false
  );

  if (!modified) return null;

  const handleReset = () => {
    const message = nl
      ? "Demo resetten? Alle campagnes en wijzigingen in deze sessie worden verwijderd."
      : "Reset demo? All campaigns and changes in this session will be cleared.";
    if (window.confirm(message)) {
      resetDemoWorkspace();
    }
  };

  return (
    <button
      type="button"
      className="pg-v13-btn pg-v13-btn--ghost mt-3 w-full text-[12px]"
      data-testid="demo-reset"
      onClick={handleReset}
    >
      {nl ? "Demo resetten" : "Reset demo"}
    </button>
  );
}
