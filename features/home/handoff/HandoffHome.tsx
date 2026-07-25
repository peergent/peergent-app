"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useHandoffHome, type HandoffHomeState } from "@/hooks/useHandoffHome";
import CommandCenter from "@/features/home/command-center/CommandCenter";
import FigmaHomePort from "@/features/home/figma-port/FigmaHomePort";
import FigmaHomeWorkspaceShell from "@/features/home/figma-port/FigmaHomeWorkspaceShell";
import HandoffSkeleton from "./HandoffSkeleton";
import "@/features/home/figma-port/figma-home.css";
import "@/features/home/command-center/command-center.css";

export type HandoffHomeProps = {
  homeState?: HandoffHomeState;
};

function HandoffHomeView({ homeState }: { homeState: HandoffHomeState }) {
  const searchParams = useSearchParams();
  const visualParam = searchParams.get("visual");
  const { pageState, errorMessage, handoff, copy, retry, previewBanner, inboxCount } = homeState;

  if (pageState === "loading") {
    return (
      <FigmaHomeWorkspaceShell inboxCount={inboxCount}>
        <div className="command-center command-center--loading">
          <div className="command-center__page">
            {previewBanner && <p className="command-center__preview-banner">{previewBanner}</p>}
            <HandoffSkeleton />
          </div>
        </div>
      </FigmaHomeWorkspaceShell>
    );
  }

  if (pageState === "error") {
    return (
      <FigmaHomeWorkspaceShell inboxCount={inboxCount}>
        <div className="command-center command-center--error">
          <div className="command-center__page command-center__page--centered">
            <p className="command-center__error-title">{copy.errorTitle}</p>
            <p className="command-center__error-body">{errorMessage}</p>
            <button type="button" onClick={retry} className="command-center__error-retry pg-focus-premium">
              <RefreshCw size={16} aria-hidden />
              {copy.errorRetry}
            </button>
            <Link href="/team" className="command-center__error-link pg-focus-premium">
              {copy.teamPulseViewTeam}
            </Link>
          </div>
        </div>
      </FigmaHomeWorkspaceShell>
    );
  }

  if (!handoff) return null;

  return (
    <>
      {previewBanner && (
        <p className="command-center__preview-banner command-center__preview-banner--fixed">{previewBanner}</p>
      )}
      {visualParam === "reference" ? (
        <FigmaHomePort homeState={homeState} onPrimaryActivate={() => undefined} />
      ) : (
        <FigmaHomeWorkspaceShell inboxCount={inboxCount}>
          <CommandCenter homeState={homeState} />
        </FigmaHomeWorkspaceShell>
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
