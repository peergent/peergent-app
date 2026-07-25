import { notFound } from "next/navigation";
import HqConceptC from "@/features/design-preview/hq/HqConceptC";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export default function DesignPreviewHqCPage() {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return <HqConceptC />;
}
