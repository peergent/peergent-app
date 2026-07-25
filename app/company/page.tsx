import { Suspense } from "react";
import KnowledgeManagementView from "@/components/knowledge/KnowledgeManagementView";

export default function CompanyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--pg-color-canvas)]" />}>
      <KnowledgeManagementView />
    </Suspense>
  );
}
