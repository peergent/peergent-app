"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useHandoffHome, type HandoffHomeState } from "@/hooks/useHandoffHome";
import FigmaHomePort from "@/features/home/figma-port/FigmaHomePort";
import HandoffSkeleton from "./HandoffSkeleton";
import PgVisionShell from "@/components/design-system/PgVisionShell";
import IedereenView from "@/features/office/iedereen/IedereenView";
import { DEMO_VISION_ROSTER } from "@/lib/office/vision-roster";
import "@/features/home/figma-port/figma-home.css";

export type HandoffHomeProps = {
  homeState?: HandoffHomeState;
  isDemo?: boolean;
};

function HandoffHomeView({
  homeState,
  isDemo = false,
}: {
  homeState: HandoffHomeState;
  isDemo?: boolean;
}) {
  const searchParams = useSearchParams();
  const visualParam = searchParams.get("visual");
  const { pageState, errorMessage, handoff, copy, retry, previewBanner } = homeState;

  if (pageState === "loading") {
    return (
      <PgVisionShell mode="iedereen" isDemo={isDemo} roster={isDemo ? DEMO_VISION_ROSTER : undefined}>
        <HandoffSkeleton />
      </PgVisionShell>
    );
  }

  if (pageState === "error") {
    return (
      <PgVisionShell mode="iedereen" isDemo={isDemo} roster={isDemo ? DEMO_VISION_ROSTER : undefined}>
        <p className="pg-v13-title text-[22px]">{copy.errorTitle}</p>
        <p className="pg-v13-sub">{errorMessage}</p>
        <button type="button" onClick={retry} className="pg-v13-btn pg-focus-premium">
          <RefreshCw size={16} aria-hidden />
          {copy.errorRetry}
        </button>
        <Link href="/team" className="pg-v13-btn pg-v13-btn--ghost mt-3 inline-flex no-underline">
          {copy.teamPulseViewTeam}
        </Link>
      </PgVisionShell>
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
        <PgVisionShell mode="iedereen" isDemo={isDemo} roster={isDemo ? DEMO_VISION_ROSTER : undefined}>
          <IedereenView homeState={homeState} isDemo={isDemo} />
        </PgVisionShell>
      )}
    </>
  );
}

function HandoffHomeWithHook() {
  const homeState = useHandoffHome();
  return <HandoffHomeView homeState={homeState} />;
}

export default function HandoffHome({ homeState, isDemo }: HandoffHomeProps = {}) {
  if (homeState) {
    return <HandoffHomeView homeState={homeState} isDemo={isDemo} />;
  }
  return <HandoffHomeWithHook />;
}
