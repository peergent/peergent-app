"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, MessageCircle, Pencil, Sparkles, Trash2 } from "lucide-react";
import type { ApprovalConnectionState } from "@/lib/peer-experience/marketing/approval/types";
import type {
  ApprovalDeliverable,
  ApprovalDeliverableContent,
  ApprovalMediaAsset,
} from "@/lib/peer-experience/marketing/approval/types";
import { validateApprovalUpload } from "@/lib/peer-experience/marketing/approval/media-validation";
import EmmaCard from "../components/EmmaCard";
import ApprovalPreviewRenderer from "./ApprovalPreviewRenderer";
import ApprovalCopyEditPanel from "./panels/ApprovalCopyEditPanel";
import ApprovalFeedbackPanel from "./panels/ApprovalFeedbackPanel";
import ApprovalImageGenerationPanel from "./panels/ApprovalImageGenerationPanel";
import ApprovalMediaLibraryPanel from "./panels/ApprovalMediaLibraryPanel";
import ApprovalRationalePanel from "./panels/ApprovalRationalePanel";
import ApprovalSchedulePanel from "./panels/ApprovalSchedulePanel";

export type ApprovalDeliverableCardProps = {
  deliverable: ApprovalDeliverable;
  connection: ApprovalConnectionState;
  onSaveContent: (content: ApprovalDeliverableContent) => void;
  onSaveMedia: (media: ApprovalMediaAsset[]) => void;
  onApprove: () => void;
  onApproveAndSchedule: (scheduledAt: string, timezone: string) => void;
  onPublishNow: () => void;
  onFeedback: (message: string) => void;
  publishMessage?: string | null;
};

function channelBadgeLabel(channel: ApprovalDeliverable["channel"]): string {
  return channel.replace(/_/g, " ");
}

function connectionLabel(account: ApprovalDeliverable["account"]): string {
  if (account.connected) return "Connected";
  if (account.connectionStatus === "needs_reconnect") return "Connection expired";
  return "Not connected";
}

export default function ApprovalDeliverableCard({
  deliverable,
  connection,
  onSaveContent,
  onSaveMedia,
  onApprove,
  onApproveAndSchedule,
  onPublishNow,
  onFeedback,
  publishMessage,
}: ApprovalDeliverableCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [carouselSlide, setCarouselSlide] = useState(0);
  const [copyOpen, setCopyOpen] = useState(false);
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = (file: File) => {
    const validation = validateApprovalUpload(file);
    if (!validation.ok) {
      setUploadError(validation.error);
      return;
    }
    setUploadError(null);
    const url = URL.createObjectURL(file);
    const asset: ApprovalMediaAsset = {
      id: `media-upload-${Date.now()}`,
      type: file.type.startsWith("video/") ? "video" : "image",
      source: "uploaded",
      url,
      thumbnailUrl: url,
      altText: file.name,
      status: "ready",
      localOnly: true,
    };
    const next =
      deliverable.format === "carousel" || deliverable.media.length > 0
        ? [...deliverable.media, asset]
        : [asset];
    onSaveMedia(next);
  };

  const handleRemoveMedia = () => {
    if (deliverable.media.length === 0) return;
    const next = deliverable.media.filter((_, i) => i !== carouselSlide);
    onSaveMedia(next);
    setCarouselSlide(Math.max(0, carouselSlide - 1));
  };

  const handlePublishClick = () => {
    if (!connection.canPublish) return;
    const confirmed = window.confirm(
      "Publish this deliverable now? Emma will prepare and confirm publication."
    );
    if (confirmed) onPublishNow();
  };

  return (
    <>
      <EmmaCard className="emma-approval-card">
        <header className="emma-approval-card__header">
          <div>
            <span className="emma-approval-card__badge">{channelBadgeLabel(deliverable.channel)}</span>
            <h3 className="emma-approval-card__title">{deliverable.title}</h3>
          </div>
          <div className="emma-approval-card__account">
            <span
              className={
                deliverable.account.connected
                  ? "emma-approval-card__connection emma-approval-card__connection--ok"
                  : "emma-approval-card__connection"
              }
            >
              {deliverable.account.name} · {connectionLabel(deliverable.account)}
            </span>
          </div>
        </header>

        <div className="emma-approval-card__preview">
          <ApprovalPreviewRenderer
            deliverable={deliverable}
            carouselSlide={carouselSlide}
            onCarouselSlideChange={setCarouselSlide}
          />
        </div>

        <div className="emma-approval-card__controls">
          <button
            type="button"
            className="emma-approval-card__control pg-focus-premium"
            onClick={() => setCopyOpen(true)}
          >
            <Pencil size={14} aria-hidden />
            Edit copy
          </button>
          <button
            type="button"
            className="emma-approval-card__control pg-focus-premium"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={14} aria-hidden />
            Upload media
          </button>
          <button
            type="button"
            className="emma-approval-card__control pg-focus-premium"
            onClick={() => setLibraryOpen(true)}
          >
            Choose from library
          </button>
          <button
            type="button"
            className="emma-approval-card__control pg-focus-premium"
            onClick={() => setGenerateOpen(true)}
          >
            <Sparkles size={14} aria-hidden />
            Generate image
          </button>
          {deliverable.media.length > 0 && (
            <button
              type="button"
              className="emma-approval-card__control pg-focus-premium"
              onClick={handleRemoveMedia}
            >
              <Trash2 size={14} aria-hidden />
              Remove media
            </button>
          )}
          <button
            type="button"
            className="emma-approval-card__control pg-focus-premium"
            onClick={() => setRationaleOpen(true)}
          >
            View rationale
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
          className="sr-only"
          aria-label="Upload media file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        {uploadError && (
          <p className="emma-approval-card__error" role="alert">
            {uploadError}
          </p>
        )}

        <div className="emma-approval-card__publishing">
          <p className="emma-card-label">Publishing</p>
          <p className="emma-voice emma-voice--muted">
            Account: {deliverable.account.name}
            {deliverable.publishing.scheduledAt &&
              ` · Scheduled ${new Date(deliverable.publishing.scheduledAt).toLocaleString()}`}
          </p>
          {!connection.canSchedule && connection.disabledReason && (
            <p className="emma-approval-card__warn">{connection.disabledReason}</p>
          )}
          {!deliverable.account.connected && (
            <Link href={connection.connectHref} className="emma-approval-card__connect pg-focus-premium">
              Connect channel
            </Link>
          )}
        </div>

        {publishMessage && (
          <p className="emma-approval-card__status" role="status">
            {publishMessage}
          </p>
        )}

        <div className="emma-approval-card__actions">
          <button
            type="button"
            className="emma-approval-card__feedback pg-focus-premium"
            onClick={() => setFeedbackOpen(true)}
          >
            <MessageCircle size={16} aria-hidden />
            Give feedback
          </button>
          <button
            type="button"
            className="emma-approval-card__approve pg-focus-premium"
            onClick={onApprove}
          >
            Approve
          </button>
          <button
            type="button"
            className="emma-approval-card__secondary pg-focus-premium"
            disabled={!connection.canSchedule}
            onClick={() => setScheduleOpen(true)}
          >
            Approve & schedule
          </button>
          <button
            type="button"
            className="emma-approval-card__secondary pg-focus-premium"
            disabled={!connection.canPublish}
            onClick={handlePublishClick}
          >
            Publish now
          </button>
        </div>
      </EmmaCard>

      <ApprovalCopyEditPanel
        open={copyOpen}
        content={deliverable.content}
        onClose={() => setCopyOpen(false)}
        onSave={onSaveContent}
      />
      <ApprovalRationalePanel
        open={rationaleOpen}
        rationale={deliverable.rationale}
        onClose={() => setRationaleOpen(false)}
      />
      <ApprovalMediaLibraryPanel open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <ApprovalImageGenerationPanel
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerated={(asset) => {
          const next =
            deliverable.media.length > 0 ? [...deliverable.media, asset] : [asset];
          onSaveMedia(next);
        }}
      />
      <ApprovalFeedbackPanel
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={onFeedback}
      />
      <ApprovalSchedulePanel
        open={scheduleOpen}
        timezone={deliverable.publishing.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
        onClose={() => setScheduleOpen(false)}
        onConfirm={onApproveAndSchedule}
      />
    </>
  );
}
