"use client";

import { useMemo } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import HqHeader from "./components/HqHeader";
import HqLandingContent from "./HqLandingContent";
import { useHqLanding } from "@/hooks/useHqLanding";
import type { HqInitialTemporal } from "@/lib/hq/hq-temporal";
import "./hq-landing.css";

export type HqLandingPageProps = HqInitialTemporal;

export default function HqLandingPage({
  initialDateTime,
  initialDateLabel,
  initialGreeting,
}: HqLandingPageProps) {
  const { account } = useAccount();
  const temporal = useMemo(
    () => ({ initialDateTime, initialDateLabel, initialGreeting }),
    [initialDateTime, initialDateLabel, initialGreeting]
  );
  const landing = useHqLanding(temporal);

  const profileInitial = useMemo(
    () =>
      account?.fullName?.charAt(0)?.toUpperCase() ??
      account?.email?.charAt(0)?.toUpperCase() ??
      "D",
    [account]
  );

  return (
    <div className="hq-landing">
      <div className="hq-landing__grid-texture" aria-hidden />

      {landing.pageState === "loading" && (
        <div className="hq-landing__loading">
          <div className="hq-landing__loading-pulse" aria-hidden />
          <p className="hq-landing__loading-text">Preparing your company…</p>
        </div>
      )}

      {landing.pageState === "error" && (
        <div className="hq-landing__loading">
          <p className="hq-landing__loading-text">Could not load your team.</p>
          <button type="button" className="hq-landing__retry pg-focus-premium" onClick={landing.retry}>
            Try again
          </button>
        </div>
      )}

      {landing.pageState === "success" && landing.viewModel && (
        <>
          <HqHeader profileInitial={profileInitial} />
          <HqLandingContent viewModel={landing.viewModel} />
        </>
      )}
    </div>
  );
}
