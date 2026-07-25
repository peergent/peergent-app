import { Suspense } from "react";
import ExecutiveBriefingHome from "@/features/home/ExecutiveBriefingHome";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--pg-bg-primary)]" />}>
      <ExecutiveBriefingHome />
    </Suspense>
  );
}
