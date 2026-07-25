import { notFound } from "next/navigation";
import HqConceptA from "@/features/design-preview/hq/HqConceptA";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export default function DesignPreviewHqAPage() {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return <HqConceptA />;
}
