"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/ui/cn";
import {
  PgCard,
  PgEmptyState,
  PgErrorState,
  PgFilterBar,
  PgInput,
  PgMeta,
  PgPage,
  PgPageHeader,
  PgSection,
  PgStateBadge,
  type PgState,
} from "@/components/design-system";
import type { ContentItem, ContentViewModel } from "@/lib/office/content/types";
import ContentReviewMode from "./ContentReviewMode";

/**
 * §4.6 Content — the body of work.
 *
 * A grid of real previews rather than cards with icons: content is looked at,
 * not read in rows. Outcome numbers appear only when a live source reports
 * them; otherwise the absence is stated.
 */

export type ContentViewProps = {
  model: ContentViewModel;
  onApprove?: (itemId: string) => void;
  onAskForChanges?: (itemId: string, notes: string) => void;
  onRetry?: (itemId: string) => void;
};

function ContentCard({
  item,
  copy,
  onReview,
  onRetry,
}: {
  item: ContentItem;
  copy: ContentViewModel["copy"];
  onReview: (item: ContentItem) => void;
  onRetry?: (itemId: string) => void;
}) {
  // §6 A failure is owned in her voice, and the work is preserved.
  if (item.failure) {
    return (
      <PgErrorState
        voice={item.failure.voice}
        preserved={item.failure.preserved}
        retry={
          onRetry
            ? { label: item.failure.retryLabel, onClick: () => onRetry(item.id) }
            : undefined
        }
        secondaryAction={
          item.href ? { label: copy.openCta, href: item.href } : undefined
        }
        testId={`content-failure-${item.id}`}
      />
    );
  }

  return (
    <PgCard interactive data-testid={`content-item-${item.id}`}>
      <div className="flex flex-wrap items-baseline gap-x-[var(--pg-space-3)] gap-y-1">
        {item.channelLabel ? (
          <span className="text-[11.5px] text-[var(--pg-color-text-tertiary)]">
            {item.channelLabel}
          </span>
        ) : null}
        <PgStateBadge
          state={item.state as PgState}
          label={item.statusLabel}
          className="ml-auto shrink-0"
        />
      </div>

      <p className="pg-voice mt-[var(--pg-space-2)]">{item.title}</p>

      {/* A real excerpt of the actual content, never a description of it. */}
      {item.preview ? (
        <p className="pg-body pg-body--sm mt-[var(--pg-space-2)]">{item.preview}</p>
      ) : null}

      <PgMeta
        className="mt-[var(--pg-space-3)]"
        items={[item.campaignTitle, item.dateLabel]}
      />

      {item.performance ? (
        <div className="mt-[var(--pg-space-3)] flex flex-wrap gap-[var(--pg-space-4)]">
          {item.performance.map((stat) => (
            <span key={stat.label} className="flex flex-col">
              <span className="text-[11.5px] text-[var(--pg-color-text-tertiary)]">
                {stat.label}
              </span>
              <span className="text-[var(--pg-type-body-sm)] tabular-nums">
                {stat.value}
              </span>
            </span>
          ))}
        </div>
      ) : item.performanceAbsence ? (
        // Honest absence — stated, not left blank.
        <p className="pg-body pg-body--sm mt-[var(--pg-space-3)] text-[var(--pg-color-text-tertiary)]">
          {item.performanceAbsence}
        </p>
      ) : null}

      <div className="mt-[var(--pg-space-3)] flex flex-wrap items-center gap-[var(--pg-space-3)]">
        {item.canReview ? (
          <button
            type="button"
            onClick={() => onReview(item)}
            className={cn(
              "pg-focus-premium inline-flex min-h-9 items-center rounded-[var(--pg-radius-sm)]",
              "bg-[var(--pg-color-accent)] px-4 text-sm font-medium",
              "text-[var(--pg-color-text-inverse)] transition",
              "hover:bg-[var(--pg-color-accent-hover)]"
            )}
            data-testid={`content-review-${item.id}`}
          >
            {copy.reviewCta}
          </button>
        ) : null}
        {item.href ? (
          <Link
            href={item.href}
            className="pg-focus-premium text-sm text-[var(--pg-color-accent)]"
          >
            {copy.openCta}
          </Link>
        ) : null}
      </div>
    </PgCard>
  );
}

export default function ContentView({
  model,
  onApprove,
  onAskForChanges,
  onRetry,
}: ContentViewProps) {
  const { copy } = model;
  const router = useRouter();
  const [reviewing, setReviewing] = useState<ContentItem | null>(null);
  const [query, setQuery] = useState(model.filters.query ?? "");

  function runSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (model.filters.state) params.set("state", model.filters.state);
    if (model.filters.channel) params.set("channel", model.filters.channel);
    if (model.filters.campaignId) params.set("campaign", model.filters.campaignId);
    if (query.trim()) params.set("q", query.trim());
    const search = params.toString();
    router.push(`/office/${model.peerId}/content${search ? `?${search}` : ""}`);
  }

  const reviewQueue = model.groups
    .flatMap((group) => group.items)
    .filter((item) => item.canReview);

  const queueIndex = reviewing
    ? reviewQueue.findIndex((item) => item.id === reviewing.id)
    : -1;

  return (
    <PgPage testId="office-content-view">
      <PgPageHeader title={copy.title} subtitle={copy.subtitle} />

      <form onSubmit={runSearch} className="max-w-md">
        <PgInput
          label={copy.searchLabel}
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          data-testid="content-search"
        />
      </form>

      {model.noSearchResults ? (
        <p className="pg-voice pg-measure" data-testid="content-no-results">
          {model.noSearchResults}
        </p>
      ) : null}

      <PgFilterBar
        groups={model.filterGroups.map((group) => ({
          id: group.id,
          label: group.label,
          options: group.options,
        }))}
        testIdPrefix="content-filter"
      />

      {model.empty ? (
        <PgEmptyState
          voice={model.empty.voice}
          next={model.empty.next ?? undefined}
          action={
            model.empty.href
              ? { label: copy.openCta, href: model.empty.href }
              : undefined
          }
          future={{
            heading: copy.futureHeading,
            promise: copy.futurePromise,
          }}
          testId="content-empty"
        />
      ) : null}

      {model.groups.map((group) => (
        <PgSection
          key={group.state}
          title={group.title}
          count={group.items.length}
          attention={group.state === "awaiting_review" || group.state === "failed"}
        >
          <div className="grid gap-[var(--pg-office-card-gap)] lg:grid-cols-2">
            {group.items.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                copy={copy}
                onReview={setReviewing}
                onRetry={onRetry}
              />
            ))}
          </div>
        </PgSection>
      ))}

      {model.pagination.pageCount > 1 ? (
        <nav
          className="flex items-center gap-[var(--pg-space-4)]"
          aria-label="Archive pages"
        >
          {model.pagination.prevHref ? (
            <Link
              href={model.pagination.prevHref}
              className="pg-focus-premium text-sm text-[var(--pg-color-accent)]"
            >
              {copy.prevPage}
            </Link>
          ) : null}
          <span className="pg-label">
            {copy.pageLabel(model.pagination.page, model.pagination.pageCount)}
          </span>
          {model.pagination.nextHref ? (
            <Link
              href={model.pagination.nextHref}
              className="pg-focus-premium text-sm text-[var(--pg-color-accent)]"
            >
              {copy.nextPage}
            </Link>
          ) : null}
        </nav>
      ) : null}

      <ContentReviewMode
        item={reviewing}
        copy={copy}
        positionLabel={
          queueIndex >= 0 && reviewQueue.length > 1
            ? `${queueIndex + 1} / ${reviewQueue.length}`
            : null
        }
        onExit={() => setReviewing(null)}
        onApprove={(id) => onApprove?.(id)}
        onAskForChanges={(id, notes) => onAskForChanges?.(id, notes)}
      />
    </PgPage>
  );
}
