import { Suspense } from "react";
import KnowledgeManagementView from "@/components/knowledge/KnowledgeManagementView";

export default function KnowledgePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712]" />}>
      <KnowledgeManagementView />
    </Suspense>
  );
}
