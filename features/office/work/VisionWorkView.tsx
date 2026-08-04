"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import type { WorkGroup, WorkGroupId, WorkItem, WorkViewModel } from "@/lib/office/work/types";

export type VisionWorkViewProps = {
  model: WorkViewModel;
  locale?: string | null;
  onOpenPreview?: (item: WorkItem) => void;
};

const GROUP_INDICATOR: Record<WorkGroupId, string> = {
  blocked_on_you: "pg-v13-ind--attn",
  blocked_elsewhere: "pg-v13-ind--attn",
  moving: "pg-v13-ind--progress",
  queued: "pg-v13-ind--progress",
  finished: "pg-v13-ind--done",
};

function statusTagClass(groupId: WorkGroupId): string {
  if (groupId === "blocked_on_you") return "pg-v13-status-tag";
  if (groupId === "finished") return "pg-v13-status-tag pg-v13-status-tag--done";
  return "pg-v13-status-tag pg-v13-status-tag--progress";
}

function WorkCard({
  item,
  group,
  locale,
  onOpenPreview,
}: {
  item: WorkItem;
  group: WorkGroup;
  locale?: string | null;
  onOpenPreview?: (item: WorkItem) => void;
}) {
  const finished = group.id === "finished";
  const waiting = group.id === "blocked_on_you";
  const primaryLine = item.primaryText ?? item.nextStep;
  const actionText = item.actionLabel;

  if (finished) {
    return (
      <div
        className="pg-v13-work-card pg-v13-work-card--compact pg-v13-work-card--clickable"
        onClick={() => onOpenPreview?.(item)}
        onKeyDown={(e) => e.key === "Enter" && onOpenPreview?.(item)}
        role="button"
        tabIndex={0}
        data-testid={`work-item-${item.id}`}
      >
        <div>
          <h4>{item.name}</h4>
          <span className="pg-v13-work-meta pg-v13-work-meta--link">
            {actionText ??
              (locale === "nl" ? "Bekijk hoe het verstuurd is →" : "See how it was sent →")}
          </span>
        </div>
        <span className={statusTagClass(group.id)}>{item.stageLabel}</span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "pg-v13-work-card pg-v13-work-card--clickable block no-underline",
        waiting && "pg-v13-work-card--waiting"
      )}
      data-testid={`work-item-${item.id}`}
      aria-label={
        locale === "nl"
          ? `${item.name} — ${item.stageLabel}${actionText ? ` — ${actionText}` : ""}`
          : `${item.name} — ${item.stageLabel}${actionText ? ` — ${actionText}` : ""}`
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[var(--pg-v13-ink)]">{item.name}</h4>
          {primaryLine ? (
            <div className="pg-v13-work-meta text-[var(--pg-v13-ink-soft)]">{primaryLine}</div>
          ) : null}
          {item.secondaryText ? (
            <div className="pg-v13-work-meta mt-1 text-[var(--pg-v13-ink-faint)]">
              {item.secondaryText}
            </div>
          ) : null}
        </div>
        <span className={statusTagClass(group.id)}>{item.stageLabel}</span>
      </div>
      {waiting && item.blockedBy ? (
        <>
          <div className="my-3 h-px bg-[var(--pg-v13-line-soft)]" />
          <p className="pg-v13-mono text-[9.5px] tracking-[0.06em] text-[var(--pg-v13-ink-faint)] uppercase">
            {locale === "nl" ? "Loopt vast op" : "Blocked on"}
          </p>
          <p className="text-[13px] font-bold text-[var(--pg-v13-ink)]">
            {item.blockedBy}
            {item.expectedLabel ? ` · ${item.expectedLabel}` : ""}
          </p>
        </>
      ) : null}
      {!waiting && item.channels.length > 0 && group.id !== "queued" ? (
        <div className="pg-v13-work-meta mt-2 text-[var(--pg-v13-ink-faint)]">
          {item.channels.map((channel) => channel.label).join(" · ")}
        </div>
      ) : null}
      {actionText ? (
        <p className="pg-v13-work-meta pg-v13-work-meta--link mt-2.5">{actionText} →</p>
      ) : null}
    </Link>
  );
}

export default function VisionWorkView({
  model,
  locale,
  onOpenPreview,
}: VisionWorkViewProps) {
  return (
    <div data-testid="office-work-view">
      {model.groups.map((group) => (
        <section key={group.id} className="pg-v13-sec">
          <p
            className={cn(
              "pg-v13-sec-label",
              group.id === "blocked_on_you" && "pg-v13-sec-label--attn"
            )}
          >
            <span className={cn("pg-v13-ind", GROUP_INDICATOR[group.id])} aria-hidden />
            {group.title}
            {group.items.length > 0 ? (
              <>
                {" "}
                <span className="pg-v13-n">{group.items.length}</span>
              </>
            ) : null}
          </p>
          {group.items.map((item) => (
            <WorkCard
              key={item.id}
              item={item}
              group={group}
              locale={locale}
              onOpenPreview={onOpenPreview}
            />
          ))}
        </section>
      ))}

      {model.proposal ? (
        <section className="pg-v13-sec pg-v13-panel p-6">
          <p className="pg-v13-sec-label">{model.copy.whereIdStart}</p>
          <p className="text-[17px] italic leading-relaxed text-[var(--pg-v13-ink)]">
            {model.proposal.voice}
          </p>
          {model.proposal.next ? (
            <p className="mt-3 text-[14px] text-[var(--pg-v13-ink-soft)]">{model.proposal.next}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
