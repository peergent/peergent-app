"use client";

import { PgStudioSkeleton, PgStudioThreshold, PgWorkPlane } from "@/components/design-system";
import { STUDIO_COPY } from "@/lib/i18n/studio-copy";

/** Loading shell — reserves chrome dimensions to prevent layout shift. */
export default function StudioLoadingShell() {
  return (
    <>
      <PgStudioThreshold
        campaignTitle={STUDIO_COPY.campaignFallback}
        directMayaDisabled
      />
      <div
        className="flex min-h-[3.25rem] shrink-0 items-center border-b border-[var(--pg-color-border-subtle)]/80 px-4 md:px-8"
        aria-hidden
      >
        <div className="h-9 w-9 animate-pulse rounded-[var(--pg-radius-md)] bg-white/[0.06]" />
        <div className="ml-2.5 h-4 w-48 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div
        className="flex h-10 shrink-0 items-end border-b border-[var(--pg-color-border-subtle)]/80 px-3 md:px-8"
        aria-hidden
      >
        <div className="mb-2.5 h-3 w-full max-w-xl animate-pulse rounded bg-white/[0.05]" />
      </div>
      <PgWorkPlane>
        <PgStudioSkeleton />
      </PgWorkPlane>
    </>
  );
}
