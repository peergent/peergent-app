"use client";

import { cn } from "@/lib/ui/cn";
import type { WorkGroup, WorkGroupId, WorkItem, WorkViewModel } from "@/lib/office/work/types";

export type VisionWorkViewProps = {
  model: WorkViewModel;
  locale?: string | null;
  onOpenCampaign?: (item: WorkItem) => void;
  onOpenPreview?: (item: WorkItem) => void;
};

const GROUP_INDICATOR: Record<WorkGroupId, string> = {
  blocked_on_you: "pg-v13-ind--attn",
  blocked_elsewhere: "pg-v13-ind--attn",
  moving: "pg-v13-ind--progress",
  queued: "pg-v13-ind--progress",
  finished: "pg-v13-ind--done",
};

function statusTagClass(groupId: WorkGroupId, item: WorkItem): string {
  if (groupId === "blocked_on_you") return "pg-v13-status-tag";
  if (groupId === "finished") return "pg-v13-status-tag pg-v13-status-tag--done";
  return "pg-v13-status-tag pg-v13-status-tag--progress";
}

function WorkCard({
  item,
  group,
  locale,
  onOpenCampaign,
  onOpenPreview,
}: {
  item: WorkItem;
  group: WorkGroup;
  locale?: string | null;
  onOpenCampaign?: (item: WorkItem) => void;
  onOpenPreview?: (item: WorkItem) => void;
}) {
  const waiting = group.id === "blocked_on_you";
  const finished = group.id === "finished";
  const inProduction = group.id === "moving";
  const clickable = waiting || finished || inProduction;

  const handleClick = () => {
    if (waiting || inProduction) onOpenCampaign?.(item);
    else if (finished) onOpenPreview?.(item);
  };

  if (finished) {
    return (
      <div
        className="pg-v13-work-card pg-v13-work-card--compact pg-v13-work-card--clickable"
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        role="button"
        tabIndex={0}
        data-testid={`work-item-${item.id}`}
      >
        <div>
          <h4>{item.name}</h4>
          <span className="pg-v13-work-meta pg-v13-work-meta--link">
            {locale === "nl" ? "Bekijk hoe het verstuurd is →" : "See how it was sent →"}
          </span>
        </div>
        <span className={statusTagClass(group.id, item)}>{item.stageLabel}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pg-v13-work-card",
        waiting && "pg-v13-work-card--waiting",
        clickable && "pg-v13-work-card--clickable"
      )}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? (e) => e.key === "Enter" && handleClick() : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      data-testid={`work-item-${item.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4>{item.name}</h4>
          <div className="pg-v13-work-meta">{item.nextStep ?? item.expectedLabel}</div>
        </div>
        <span className={statusTagClass(group.id, item)}>{item.stageLabel}</span>
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
          <p className="pg-v13-work-meta pg-v13-work-meta--link mt-2.5">
            {locale === "nl" ? "Open campagne →" : "Open campaign →"}
          </p>
        </>
      ) : null}
      {!waiting && item.channels.length > 0 ? (
        <div className="pg-v13-work-meta mt-2">
          {item.channels.map((channel) => channel.label).join(" · ")}
        </div>
      ) : null}
      {!waiting && item.nextStep ? (
        <div className="pg-v13-work-meta mt-1">{item.nextStep}</div>
      ) : null}
    </div>
  );
}


function displayGroups(groups: WorkGroup[]): WorkGroup[] {
  const moving = groups.find((group) => group.id === "moving");
  const queued = groups.find((group) => group.id === "queued");
  if (!moving || !queued?.items.length) return groups;

  const merged: WorkGroup = {
    id: "moving",
    title: moving.title,
    items: [...moving.items, ...queued.items],
    collapsedByDefault: false,
  };

  const order: WorkGroupId[] = [
    "blocked_on_you",
    "blocked_elsewhere",
    "moving",
    "finished",
  ];

  const withoutMerged = groups.filter((group) => group.id !== "moving" && group.id !== "queued");
  return [...withoutMerged, merged].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  );
}

export default function VisionWorkView({
  model,
  locale,
  onOpenCampaign,
  onOpenPreview,
}: VisionWorkViewProps) {
  const groups = displayGroups(model.groups);

  return (
    <div data-testid="office-work-view">
      {groups.map((group) => (
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
              onOpenCampaign={onOpenCampaign}
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
