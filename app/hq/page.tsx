import { Suspense } from "react";
import HqLandingPage from "@/features/hq/HqLandingPage";
import { buildHqInitialTemporal } from "@/lib/hq/hq-temporal";

export default function HqPage() {
  const now = new Date();
  const temporal = buildHqInitialTemporal(now);

  return (
    <Suspense fallback={null}>
      <HqLandingPage
        initialDateTime={temporal.initialDateTime}
        initialDateLabel={temporal.initialDateLabel}
        initialGreeting={temporal.initialGreeting}
      />
    </Suspense>
  );
}
