import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PgButton from "@/components/design-system/PgButton";
import { STUDIO_COPY } from "@/lib/i18n/studio-copy";
import { cn } from "@/lib/ui/cn";

export type PgStudioThresholdProps = {
  campaignTitle: string;
  onDirectMaya?: () => void;
  directMayaDisabled?: boolean;
  className?: string;
};

/**
 * Studio threshold strip — back to Team, campaign name, Direct Maya.
 * Design review: 48px height, ghost action right.
 */
export default function PgStudioThreshold({
  campaignTitle,
  onDirectMaya,
  directMayaDisabled = false,
  className,
}: PgStudioThresholdProps) {
  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center gap-3 border-b border-[var(--pg-color-border-subtle)]",
        "px-4 md:px-8",
        className
      )}
    >
      <Link
        href="/team"
        className={cn(
          "pg-focus-premium inline-flex min-h-9 shrink-0 items-center gap-1.5",
          "text-sm font-medium text-[var(--pg-color-text-secondary)]",
          "transition hover:text-[var(--pg-color-text-primary)]"
        )}
      >
        <ArrowLeft size={16} aria-hidden />
        {STUDIO_COPY.threshold.backToTeam}
      </Link>

      <div className="min-w-0 flex-1 truncate text-center text-sm font-medium text-[var(--pg-color-text-primary)]">
        {campaignTitle}
      </div>

      <PgButton
        variant="ghost"
        size="sm"
        className="shrink-0"
        disabled={directMayaDisabled || !onDirectMaya}
        onClick={onDirectMaya}
        aria-label={STUDIO_COPY.threshold.directMaya}
      >
        {STUDIO_COPY.threshold.directMaya}
      </PgButton>
    </header>
  );
}
