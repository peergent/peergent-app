"use client";

import type { ApprovalDeliverable } from "@/lib/peer-experience/marketing/approval/types";
import { selectPreviewChannel } from "@/lib/peer-experience/marketing/approval/build-approval-deliverable";
import BlogPreview from "../previews/BlogPreview";
import GoogleAdPreview from "../previews/GoogleAdPreview";
import LinkedInPostPreview from "../previews/LinkedInPostPreview";
import MetaAdPreview from "../previews/MetaAdPreview";
import NewsletterPreview from "../previews/NewsletterPreview";
import InstagramApprovalPreview from "./previews/InstagramApprovalPreview";

export type ApprovalPreviewRendererProps = {
  deliverable: ApprovalDeliverable;
  carouselSlide?: number;
  onCarouselSlideChange?: (index: number) => void;
};

export default function ApprovalPreviewRenderer({
  deliverable,
  carouselSlide,
  onCarouselSlideChange,
}: ApprovalPreviewRendererProps) {
  const channel = selectPreviewChannel(deliverable);
  const authorName = deliverable.account.name;
  const body = deliverable.content.caption ?? deliverable.content.body ?? "";
  const title = deliverable.content.headline ?? deliverable.title;

  switch (channel) {
    case "instagram":
    case "facebook":
      return (
        <InstagramApprovalPreview
          deliverable={deliverable}
          activeSlide={carouselSlide}
          onSlideChange={onCarouselSlideChange}
        />
      );
    case "linkedin":
      return (
        <LinkedInPostPreview
          authorName={authorName}
          title={title}
          body={body}
          variant="hero"
        />
      );
    case "newsletter":
      return (
        <NewsletterPreview
          subject={title}
          body={body}
          preheader={deliverable.content.callToAction}
        />
      );
    case "blog":
      return <BlogPreview headline={title} body={body} />;
    case "google_ads":
      return (
        <GoogleAdPreview
          headline={title}
          body={body}
          callToAction={deliverable.content.callToAction}
        />
      );
    case "meta_ads":
      return (
        <MetaAdPreview
          headline={title}
          body={body}
          callToAction={deliverable.content.callToAction}
        />
      );
    default:
      return (
        <LinkedInPostPreview
          authorName={authorName}
          title={title}
          body={body}
          variant="hero"
        />
      );
  }
}
