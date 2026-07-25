import { notFound } from "next/navigation";
import HqPreviewIndex from "@/features/design-preview/hq/HqPreviewIndex";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export default function DesignPreviewHqIndexPage() {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return <HqPreviewIndex />;
}
