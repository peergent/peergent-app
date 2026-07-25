"use client";

import { Globe, MessageCircle, Repeat2, Send, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export type LinkedInPostPreviewProps = {
  authorName: string;
  title: string;
  body: string;
  variant?: "default" | "hero";
};

export default function LinkedInPostPreview({
  authorName,
  title,
  body,
  variant = "default",
}: LinkedInPostPreviewProps) {
  const initial = authorName.charAt(0).toUpperCase();

  if (variant === "hero") {
    return (
      <div
        className="emma-preview emma-preview--linkedin emma-preview--linkedin-hero"
        aria-label="LinkedIn post preview"
      >
        <header className="emma-preview--linkedin__header">
          <div className="emma-preview--linkedin__avatar">{initial}</div>
          <div>
            <p className="emma-preview--linkedin__name">{authorName}</p>
            <p className="emma-preview--linkedin__meta">
              Marketing Manager · 1h · <Globe size={12} aria-hidden />
            </p>
          </div>
        </header>

        <div className="emma-preview--linkedin-hero__media">
          <p className="emma-preview--linkedin-hero__headline">{title}</p>
          <span className="emma-preview--linkedin-hero__brand">Peergent</span>
        </div>

        {body.trim() && (
          <div className="emma-preview--linkedin__body">
            <p className="emma-preview--linkedin__text">{body}</p>
          </div>
        )}

        <footer className="emma-preview--linkedin__footer">
          <span className="emma-preview--linkedin__stat">
            <ThumbsUp size={14} aria-hidden /> 24
          </span>
          <span className="emma-preview--linkedin__stat">
            <MessageCircle size={14} aria-hidden /> 8
          </span>
          <span className="emma-preview--linkedin__stat">
            <Repeat2 size={14} aria-hidden /> 3
          </span>
          <span className="emma-preview--linkedin__stat">
            <Send size={14} aria-hidden /> 2
          </span>
        </footer>
      </div>
    );
  }

  return (
    <div className="emma-preview emma-preview--linkedin" aria-label="LinkedIn post preview">
      <header className="emma-preview--linkedin__header">
        <div className="emma-preview--linkedin__avatar">{initial}</div>
        <div>
          <p className="emma-preview--linkedin__name">{authorName}</p>
          <p className="emma-preview--linkedin__meta">
            Marketing Manager · 1h · <Globe size={12} aria-hidden />
          </p>
        </div>
      </header>

      <div className="emma-preview--linkedin__body">
        <p className="emma-preview--linkedin__title">{title}</p>
        <p className="emma-preview--linkedin__text">{body}</p>
      </div>

      <footer className="emma-preview--linkedin__footer">
        <button type="button" className="emma-preview--linkedin__action">
          <ThumbsUp size={16} aria-hidden /> Like
        </button>
        <button type="button" className="emma-preview--linkedin__action">
          <MessageCircle size={16} aria-hidden /> Comment
        </button>
        <button type="button" className="emma-preview--linkedin__action">
          <Repeat2 size={16} aria-hidden /> Repost
        </button>
        <button type="button" className={cn("emma-preview--linkedin__action")}>
          <Send size={16} aria-hidden /> Send
        </button>
      </footer>
    </div>
  );
}
