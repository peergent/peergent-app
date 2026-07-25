import type { ProgressRailChapter, ProgressRailChapterId } from "@/lib/peer-experience/marketing/build-progress-rail-view-model";
import { STUDIO_COPY } from "@/lib/i18n/studio-copy";
import { cn } from "@/lib/ui/cn";

export type PgProgressRailProps = {
  chapters: ProgressRailChapter[];
  currentChapterId: ProgressRailChapterId;
  onSelectChapter?: (chapterId: ProgressRailChapterId) => void;
  className?: string;
};

/**
 * Campaign story rail — chapters of the arc, not a numbered wizard.
 */
export default function PgProgressRail({
  chapters,
  currentChapterId,
  onSelectChapter,
  className,
}: PgProgressRailProps) {
  return (
    <nav
      aria-label={STUDIO_COPY.progressRail.ariaLabel}
      className={cn(
        "flex h-10 shrink-0 items-stretch overflow-x-auto border-b border-[var(--pg-color-border-subtle)]/80",
        "px-3 md:px-8",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <ol className="flex min-w-full items-end gap-1 md:gap-2">
        {chapters.map((chapter, index) => {
          const isCurrent = chapter.id === currentChapterId;
          const isSelectable = Boolean(chapter.timelineNodeId && onSelectChapter);
          const isLast = index === chapters.length - 1;

          const label = (
            <span
              className={cn(
                "truncate pb-2.5 text-[11px] font-medium tracking-wide md:text-xs",
                chapter.state === "current" &&
                  "border-b-2 border-[var(--pg-color-accent)] text-[var(--pg-color-text-primary)]",
                chapter.state === "completed" &&
                  "border-b-2 border-transparent text-[var(--pg-color-text-secondary)]",
                chapter.state === "upcoming" &&
                  "border-b-2 border-transparent text-[var(--pg-color-text-tertiary)]"
              )}
            >
              {chapter.label}
            </span>
          );

          return (
            <li
              key={chapter.id}
              className={cn(
                "flex min-w-0 flex-1 items-end",
                !isLast && "pr-1 md:pr-2"
              )}
            >
              {isSelectable ? (
                <button
                  type="button"
                  onClick={() => onSelectChapter?.(chapter.id)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "pg-focus-premium w-full min-w-[4rem] text-left transition",
                    "hover:text-[var(--pg-color-text-primary)]"
                  )}
                >
                  {label}
                </button>
              ) : (
                <div aria-current={isCurrent ? "step" : undefined} className="w-full min-w-[4rem]">
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
