import { notFound } from "next/navigation";
import HqConceptD from "@/features/design-preview/hq/HqConceptD";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export default function DesignPreviewHqDPage() {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return <HqConceptD />;
}
