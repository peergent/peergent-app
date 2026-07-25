import { notFound } from "next/navigation";
import StudioShellPreviewPage from "@/features/studio/StudioShellPreviewPage";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export default function Page() {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return <StudioShellPreviewPage />;
}
