"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useHandoffHome, type HandoffHomeState } from "@/hooks/useHandoffHome";
import FigmaHomePort from "@/features/home/figma-port/FigmaHomePort";
import HandoffSkeleton from "./HandoffSkeleton";
import V17CustomerShell from "@/features/customer-v17/shell/V17CustomerShell";
import V17CommandCenter from "@/features/customer-v17/command-center/V17CommandCenter";
import "@/features/home/figma-port/figma-home.css";
import "@/features/customer-v17/styles/v17-customer.css";

export type HandoffHomeProps = {
  homeState?: HandoffHomeState;
};

function HandoffHomeView({ homeState }: { homeState: HandoffHomeState }) {
  const searchParams = useSearchParams();
  const visualParam = searchParams.get("visual");
  const { pageState, errorMessage, handoff, copy, retry, previewBanner } = homeState;

  if (pageState === "loading") {
    return (
      <V17CustomerShell>
        <div className="v17-page">
          {previewBanner ? <p className="v17-page-support">{previewBanner}</p> : null}
          <HandoffSkeleton />
        </div>
      </V17CustomerShell>
    );
  }

  if (pageState === "error") {
    return (
      <V17CustomerShell>
        <div className="v17-page">
          <p className="v17-page-title">{copy.errorTitle}</p>
          <p className="v17-page-support">{errorMessage}</p>
          <button type="button" onClick={retry} className="v17-btn v17-btn--primary pg-focus-premium">
            <RefreshCw size={16} aria-hidden />
            {copy.errorRetry}
          </button>
          <Link href="/team" className="v17-btn v17-btn--ghost pg-focus-premium">
            {copy.teamPulseViewTeam}
          </Link>
        </div>
      </V17CustomerShell>
    );
  }

  if (!handoff) return null;

  return (
    <>
      {previewBanner ? (
        <p className="v17-page-support" style={{ position: "fixed", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
          {previewBanner}
        </p>
      ) : null}
      {visualParam === "reference" ? (
        <FigmaHomePort homeState={homeState} onPrimaryActivate={() => undefined} />
      ) : (
        <V17CustomerShell>
          <V17CommandCenter homeState={homeState} />
        </V17CustomerShell>
      )}
    </>
  );
}

function HandoffHomeWithHook() {
  const homeState = useHandoffHome();
  return <HandoffHomeView homeState={homeState} />;
}

export default function HandoffHome({ homeState }: HandoffHomeProps = {}) {
  if (homeState) {
    return <HandoffHomeView homeState={homeState} />;
  }
  return <HandoffHomeWithHook />;
}
