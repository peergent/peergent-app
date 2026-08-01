"use client";

import { useState } from "react";
import Link from "next/link";
import type { ContentItem, ContentViewModel } from "@/lib/office/content/types";
import ContentReviewMode from "./ContentReviewMode";

export type VisionContentViewProps = {
  model: ContentViewModel;
  locale?: string | null;
  onApprove?: (itemId: string) => void;
  onAskForChanges?: (itemId: string, notes: string) => void;
  onRetry?: (itemId: string) => void;
  onOpenPreview?: (item: ContentItem) => void;
};

function ContentCard({
  item,
  copy,
  onReview,
  onOpenPreview,
}: {
  item: ContentItem;
  copy: ContentViewModel["copy"];
  onReview: (item: ContentItem) => void;
  onOpenPreview?: (item: ContentItem) => void;
}) {
  const waiting = item.state === "awaiting_review";
  const published = item.state === "published";

  return (
    <div
      className={
        waiting
          ? "pg-v13-work-card pg-v13-work-card--waiting pg-v13-work-card--clickable"
          : "pg-v13-work-card pg-v13-work-card--clickable"
      }
      onClick={() => {
        if (waiting && item.canReview) onReview(item);
        else if (published) onOpenPreview?.(item);
        else if (item.href) window.location.href = item.href;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (item.canReview) onReview(item);
        }
      }}
      role="button"
      tabIndex={0}
      data-testid={`content-item-${item.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4>{item.title}</h4>
          {item.preview ? (
            <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-[var(--pg-v13-ink-soft)]">
              {item.preview}
            </p>
          ) : null}
          <div className="pg-v13-work-meta">
            {[item.channelLabel, item.campaignTitle, item.dateLabel]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <span
          className={
            waiting
              ? "pg-v13-status-tag"
              : item.state === "published"
                ? "pg-v13-status-tag pg-v13-status-tag--done"
                : "pg-v13-status-tag pg-v13-status-tag--progress"
          }
        >
          {item.statusLabel}
        </span>
      </div>
      {item.performance?.length ? (
        <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--pg-v13-line-soft)] pt-3">
          {item.performance.map((stat) => (
            <span key={stat.label} className="text-[11px] text-[var(--pg-v13-ink-faint)]">
              <strong className="text-[var(--pg-v13-ink)]">{stat.value}</strong> {stat.label}
            </span>
          ))}
        </div>
      ) : null}
      {waiting ? (
        <p className="pg-v13-work-meta pg-v13-work-meta--link mt-2.5">{copy.reviewCta} →</p>
      ) : null}
    </div>
  );
}

/**
 * Vision v13 Content — work-card presentation; review flow unchanged.
 */
export default function VisionContentView({
  model,
  locale,
  onApprove,
  onAskForChanges,
  onRetry,
  onOpenPreview,
}: VisionContentViewProps) {
  const { copy } = model;
  const [reviewing, setReviewing] = useState<ContentItem | null>(null);
  const nl = locale === "nl";
  const visibleGroups = model.groups.filter((g) => g.items.length > 0);

  if (reviewing) {
    return (
      <ContentReviewMode
        item={reviewing}
        copy={copy}
        onExit={() => setReviewing(null)}
        onApprove={(id) => onApprove?.(id)}
        onAskForChanges={(id, notes) => onAskForChanges?.(id, notes)}
      />
    );
  }

  return (
    <div data-testid="office-content-view">
      <div className="mb-6 flex flex-wrap gap-2">
        {model.filterGroups.map((group) =>
          group.options.map((option) => (
            <Link
              key={`${group.id}-${option.id}`}
              href={option.href}
              className={
                option.active
                  ? "pg-v13-chip pg-v13-chip--active no-underline"
                  : "pg-v13-chip no-underline"
              }
            >
              {option.label}
            </Link>
          ))
        )}
      </div>

      {model.empty ? (
        <div className="pg-v13-panel px-6 py-5">
          <p className="text-[15px] text-[var(--pg-v13-ink-soft)]">{model.empty.voice}</p>
          {model.empty.href ? (
            <Link href={model.empty.href} className="pg-v13-btn pg-v13-btn--ghost mt-4 no-underline">
              {model.empty.next}
            </Link>
          ) : null}
        </div>
      ) : null}

      {visibleGroups.map((group) => (
        <section key={group.state} className="pg-v13-sec">
          <p className="pg-v13-sec-label">{group.title}</p>
          {group.items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              copy={copy}
              onReview={setReviewing}
              onOpenPreview={onOpenPreview}
            />
          ))}
        </section>
      ))}

      {model.pagination.pageCount > 1 ? (
        <div className="flex items-center gap-3">
          {model.pagination.prevHref ? (
            <Link href={model.pagination.prevHref} className="pg-v13-btn pg-v13-btn--ghost no-underline">
              {nl ? "Vorige" : "Previous"}
            </Link>
          ) : null}
          {model.pagination.nextHref ? (
            <Link href={model.pagination.nextHref} className="pg-v13-btn pg-v13-btn--ghost no-underline">
              {nl ? "Volgende" : "Next"}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
