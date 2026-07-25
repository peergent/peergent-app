"use client";

import type { EmmaPreviewViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import BlogPreview from "./BlogPreview";
import GoogleAdPreview from "./GoogleAdPreview";
import InstagramPostPreview from "./InstagramPostPreview";
import LandingPagePreview from "./LandingPagePreview";
import LinkedInPostPreview from "./LinkedInPostPreview";
import MetaAdPreview from "./MetaAdPreview";
import NewsletterPreview from "./NewsletterPreview";

export type DeliverablePreviewProps = {
  preview: EmmaPreviewViewModel;
  variant?: "default" | "hero";
};

export default function DeliverablePreview({
  preview,
  variant = "default",
}: DeliverablePreviewProps) {
  if (!preview.hasContent) return null;

  const props = {
    authorName: preview.authorName,
    title: preview.title,
    body: preview.body,
  };

  switch (preview.kind) {
    case "instagram":
      return <InstagramPostPreview {...props} />;
    case "newsletter":
    case "email":
      return (
        <NewsletterPreview
          subject={preview.title}
          body={preview.body}
          preheader={preview.callToAction}
        />
      );
    case "blog":
      return <BlogPreview headline={preview.title} body={preview.body} />;
    case "landing_page":
      return (
        <LandingPagePreview
          headline={preview.title}
          body={preview.body}
          callToAction={preview.callToAction}
        />
      );
    case "meta_ad":
      return (
        <MetaAdPreview
          headline={preview.title}
          body={preview.body}
          callToAction={preview.callToAction}
        />
      );
    case "google_ad":
      return (
        <GoogleAdPreview
          headline={preview.title}
          body={preview.body}
          callToAction={preview.callToAction}
        />
      );
    case "linkedin":
      return <LinkedInPostPreview {...props} variant={variant} />;
    default:
      return <LinkedInPostPreview {...props} variant={variant} />;
  }
}
