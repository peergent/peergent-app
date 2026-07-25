import { Suspense } from "react";
import PeersPageClient from "@/app/peers/PeersPageClient";

export default function TeamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--pg-color-canvas)]" />}>
      <PeersPageClient />
    </Suspense>
  );
}
