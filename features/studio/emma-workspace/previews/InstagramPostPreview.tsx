"use client";

import { Heart, MessageCircle, MoreHorizontal, Send, Bookmark } from "lucide-react";

export type InstagramPostPreviewProps = {
  authorName: string;
  title: string;
  body: string;
};

export default function InstagramPostPreview({
  authorName,
  title,
  body,
}: InstagramPostPreviewProps) {
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <div className="emma-preview emma-preview--instagram" aria-label="Instagram post preview">
      <header className="emma-preview--instagram__header">
        <div className="emma-preview--instagram__avatar">{initial}</div>
        <div>
          <p className="emma-preview--instagram__username">{authorName.toLowerCase().replace(/\s+/g, "")}</p>
          <p className="emma-preview--instagram__location">Sponsored</p>
        </div>
        <MoreHorizontal size={18} aria-hidden className="emma-preview--instagram__more" />
      </header>

      <div className="emma-preview--instagram__media">
        <div className="emma-preview--instagram__media-inner">
          <p className="emma-preview--instagram__media-title">{title}</p>
        </div>
      </div>

      <div className="emma-preview--instagram__actions">
        <Heart size={22} aria-hidden />
        <MessageCircle size={22} aria-hidden />
        <Send size={22} aria-hidden />
        <Bookmark size={22} aria-hidden className="emma-preview--instagram__save" />
      </div>

      <div className="emma-preview--instagram__caption">
        <strong>{authorName.toLowerCase().replace(/\s+/g, "")}</strong> {body}
      </div>
    </div>
  );
}
