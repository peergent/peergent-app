"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import type { ApprovalDeliverable, ApprovalMediaAsset } from "@/lib/peer-experience/marketing/approval/types";
import { cn } from "@/lib/ui/cn";

export type InstagramApprovalPreviewProps = {
  deliverable: ApprovalDeliverable;
  activeSlide?: number;
  onSlideChange?: (index: number) => void;
  onReorderMedia?: (media: ApprovalMediaAsset[]) => void;
};

function usernameFromAccount(deliverable: ApprovalDeliverable): string {
  return (
    deliverable.account.username ??
    deliverable.account.name.toLowerCase().replace(/\s+/g, "")
  );
}

function MediaSlide({
  asset,
  title,
  isCarousel,
}: {
  asset: ApprovalMediaAsset;
  title: string;
  isCarousel: boolean;
}) {
  const hasUrl = Boolean(asset.url);
  const isGenerating = asset.status === "generating";

  return (
    <div
      className={cn(
        "emma-approval-ig__media",
        isCarousel && "emma-approval-ig__media--carousel"
      )}
      role="img"
      aria-label={asset.altText ?? title}
    >
      {hasUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={asset.altText ?? title}
          className="emma-approval-ig__media-img"
        />
      ) : (
        <div className="emma-approval-ig__media-placeholder">
          <p className="emma-approval-ig__media-title">{title}</p>
          {isGenerating && (
            <p className="emma-approval-ig__media-status" role="status">
              Generating image…
            </p>
          )}
        </div>
      )}
      {asset.localOnly && hasUrl && (
        <p className="emma-approval-ig__local-badge">Local preview only</p>
      )}
    </div>
  );
}

export default function InstagramApprovalPreview({
  deliverable,
  activeSlide: controlledSlide,
  onSlideChange,
}: InstagramApprovalPreviewProps) {
  const [internalSlide, setInternalSlide] = useState(0);
  const activeSlide = controlledSlide ?? internalSlide;
  const setSlide = onSlideChange ?? setInternalSlide;

  const media = deliverable.media.length
    ? deliverable.media
    : [{ id: "placeholder", type: "image" as const, source: "generated" as const, url: "", status: "ready" as const }];
  const isCarousel = deliverable.format === "carousel" && media.length > 1;
  const username = usernameFromAccount(deliverable);
  const initial = deliverable.account.name.charAt(0).toUpperCase();
  const caption = deliverable.content.caption ?? deliverable.content.body ?? "";
  const hashtags = deliverable.content.hashtags ?? [];
  const hashtagLine = hashtags.join(" ");

  const goPrev = useCallback(() => {
    setSlide(Math.max(0, activeSlide - 1));
  }, [activeSlide, setSlide]);

  const goNext = useCallback(() => {
    setSlide(Math.min(media.length - 1, activeSlide + 1));
  }, [activeSlide, media.length, setSlide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isCarousel) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, isCarousel]);

  const scheduledLabel = deliverable.publishing.scheduledAt
    ? new Date(deliverable.publishing.scheduledAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <article
      className="emma-approval-ig"
      aria-label="Instagram post preview"
      data-testid="instagram-approval-preview"
    >
      <header className="emma-approval-ig__header">
        <div className="emma-approval-ig__avatar" aria-hidden>
          {deliverable.account.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deliverable.account.avatarUrl} alt="" />
          ) : (
            initial
          )}
        </div>
        <div>
          <p className="emma-approval-ig__username">{username}</p>
          <p className="emma-approval-ig__meta">
            {scheduledLabel ? `Scheduled · ${scheduledLabel}` : "Preview"}
          </p>
        </div>
        <MoreHorizontal size={18} aria-hidden className="emma-approval-ig__more" />
      </header>

      <div className="emma-approval-ig__media-wrap">
        {isCarousel && (
          <>
            <button
              type="button"
              className="emma-approval-ig__nav emma-approval-ig__nav--prev pg-focus-premium"
              onClick={goPrev}
              disabled={activeSlide === 0}
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="emma-approval-ig__nav emma-approval-ig__nav--next pg-focus-premium"
              onClick={goNext}
              disabled={activeSlide >= media.length - 1}
              aria-label="Next slide"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </>
        )}
        <MediaSlide
          asset={media[activeSlide]!}
          title={deliverable.title}
          isCarousel={isCarousel}
        />
        {isCarousel && (
          <div className="emma-approval-ig__indicators" aria-label={`Slide ${activeSlide + 1} of ${media.length}`}>
            {media.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "emma-approval-ig__dot pg-focus-premium",
                  index === activeSlide && "emma-approval-ig__dot--active"
                )}
                onClick={() => setSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeSlide ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div className="emma-approval-ig__actions" aria-hidden>
        <Heart size={22} />
        <MessageCircle size={22} />
        <Send size={22} />
        <Bookmark size={22} className="emma-approval-ig__save" />
      </div>

      <div className="emma-approval-ig__caption">
        <strong>{username}</strong> {caption}
        {hashtagLine && (
          <p className="emma-approval-ig__hashtags">{hashtagLine}</p>
        )}
      </div>

      {deliverable.content.firstComment && (
        <p className="emma-approval-ig__first-comment">
          <span className="emma-approval-ig__first-comment-label">First comment · </span>
          {deliverable.content.firstComment}
        </p>
      )}

      {deliverable.content.callToAction && (
        <p className="emma-approval-ig__cta">{deliverable.content.callToAction}</p>
      )}
    </article>
  );
}
