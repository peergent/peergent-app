"use client";

import { useHandoffHome } from "@/hooks/useHandoffHome";
import HandoffHome from "@/features/home/handoff/HandoffHome";

/**
 * Executive Briefing orchestrator for `/home`.
 *
 * Phase 1: architecture scaffold — delegates rendering to HandoffHome for unchanged appearance.
 * Later phases wire `components/workforce/*` sections here.
 */
export default function ExecutiveBriefingHome() {
  const homeState = useHandoffHome();

  return <HandoffHome homeState={homeState} />;
}
