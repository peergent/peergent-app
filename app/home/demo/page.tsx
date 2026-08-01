"use client";

import { Suspense, useMemo } from "react";
import HandoffHome from "@/features/home/handoff/HandoffHome";
import { buildDemoHomeState } from "@/lib/home/demo/build-demo-home-state";

function HomeDemoContent() {
  const homeState = useMemo(() => buildDemoHomeState(), []);
  return <HandoffHome homeState={homeState} isDemo />;
}

export default function HomeDemoPage() {
  return (
    <Suspense fallback={null}>
      <HomeDemoContent />
    </Suspense>
  );
}
