import { notFound } from "next/navigation";
import HqConceptB from "@/features/design-preview/hq/HqConceptB";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export default function DesignPreviewHqBPage() {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return <HqConceptB />;
}
