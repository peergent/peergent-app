"use client";

import PgVisionModal from "./PgVisionModal";

export type ContentPreviewStat = {
  label: string;
  value: string;
};

export type PgContentPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  title: string;
  channelLabel: string;
  campaignTitle?: string | null;
  previewText?: string | null;
  stats: ContentPreviewStat[];
};

const CHANNEL_ACCENT: Record<string, string> = {
  linkedin: "#0A66C2",
  instagram: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)",
  google_ads: "#EFAA53",
  newsletter: "var(--pg-v13-grad)",
  email: "var(--pg-v13-grad)",
  blog: "var(--pg-v13-blue)",
};

function accentFor(channel: string): string {
  const key = channel.toLowerCase().replace(/\s+/g, "_");
  if (key.includes("linkedin")) return CHANNEL_ACCENT.linkedin!;
  if (key.includes("instagram")) return CHANNEL_ACCENT.instagram!;
  if (key.includes("google")) return CHANNEL_ACCENT.google_ads!;
  if (key.includes("nieuwsbrief") || key.includes("newsletter") || key.includes("email"))
    return CHANNEL_ACCENT.newsletter!;
  if (key.includes("blog")) return CHANNEL_ACCENT.blog!;
  return "var(--pg-v13-blue)";
}

export default function PgContentPreviewModal({
  open,
  onClose,
  locale,
  title,
  channelLabel,
  campaignTitle,
  previewText,
  stats,
}: PgContentPreviewModalProps) {
  const nl = locale === "nl";

  return (
    <PgVisionModal open={open} onClose={onClose} size="workspace" testId="content-preview-modal">
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              {channelLabel}
            </p>
            <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">{title}</h3>
            {campaignTitle ? (
              <p className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)]">{campaignTitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pg-v13-modal-close flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] text-[var(--pg-v13-ink-soft)]"
            aria-label={nl ? "Sluiten" : "Close"}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-7 py-6">
        <div
          className="mb-5 overflow-hidden rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)]"
          style={{ background: "var(--pg-v13-panel)" }}
        >
          <div className="h-[6px] w-full" style={{ background: accentFor(channelLabel) }} />
          <div className="px-5 py-4">
            <p className="text-[13.5px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
              {previewText ??
                (nl
                  ? "Voorbeeld van wat live stond — metrics hieronder komen uit gekoppelde bronnen."
                  : "Preview of what went live — metrics below come from connected sources.")}
            </p>
          </div>
        </div>

        <p className="pg-v13-mono mb-3 text-[10px] font-bold tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
          {nl ? "Resultaten" : "Performance"}
        </p>
        <div className="mb-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="pg-v13-stat-box">
              <div className="pg-v13-stat-lbl">{stat.label}</div>
              <div className="pg-v13-stat-val text-[19px]">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </PgVisionModal>
  );
}
