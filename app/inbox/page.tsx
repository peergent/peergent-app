import { Suspense } from "react";
import InboxPage from "@/features/inbox/InboxPage";

export default function InboxRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--pg-color-canvas)]" />}>
      <InboxPage />
    </Suspense>
  );
}
