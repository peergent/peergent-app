"use client";

import { useMemo, useState } from "react";
import PgVisionModal from "@/components/design-system/PgVisionModal";

export type ScheduleChoice = "now" | "tomorrow" | "custom";

export type CampaignScheduleModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  onConfirm: (scheduledAtIso: string) => void;
  initialScheduledAt?: string | null;
};

function tomorrowAtNine(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function formatTimezoneLabel(locale?: string | null): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const offset = now.toLocaleTimeString(locale === "nl" ? "nl-NL" : "en-GB", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    return `${tz} (${offset.split(" ").pop() ?? ""})`;
  } catch {
    return "Europe/Amsterdam (CET)";
  }
}

export default function CampaignScheduleModal({
  open,
  onClose,
  locale,
  onConfirm,
  initialScheduledAt,
}: CampaignScheduleModalProps) {
  const nl = locale === "nl";
  const [choice, setChoice] = useState<ScheduleChoice>("tomorrow");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("09:00");
  const timezoneLabel = useMemo(() => formatTimezoneLabel(locale), [locale]);

  const resolvedDate = useMemo(() => {
    if (choice === "now") return new Date();
    if (choice === "tomorrow") return tomorrowAtNine();
    if (customDate && customTime) {
      const d = new Date(`${customDate}T${customTime}:00`);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return tomorrowAtNine();
  }, [choice, customDate, customTime]);

  const previewLabel = resolvedDate.toLocaleString(nl ? "nl-NL" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleConfirm = () => {
    onConfirm(resolvedDate.toISOString());
    onClose();
  };

  return (
    <PgVisionModal open={open} onClose={onClose} size="workspace" testId="campaign-schedule-modal">
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">Emma</p>
        <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">
          {nl ? "Campagne inplannen" : "Schedule campaign"}
        </h3>
        <p className="mt-2 text-[14px] text-[var(--pg-v13-ink-soft)]">
          {nl
            ? "Kies wanneer je campagne live mag gaan. Na inplannen publiceer ik op het gekozen moment."
            : "Choose when your campaign may go live. After scheduling, I publish at the chosen time."}
        </p>
      </div>

      <div className="space-y-3 px-7 py-6">
        {(
          [
            { id: "now" as const, label: nl ? "Nu publiceren" : "Publish now", desc: nl ? "Direct live" : "Go live immediately" },
            { id: "tomorrow" as const, label: nl ? "Morgen om 09:00" : "Tomorrow at 09:00", desc: nl ? "Volgende werkdag ochtend" : "Next weekday morning" },
            { id: "custom" as const, label: nl ? "Eigen datum & tijd" : "Custom date & time", desc: nl ? "Kies zelf" : "Pick yourself" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            data-testid={`schedule-option-${opt.id}`}
            className={`w-full rounded-[var(--pg-radius-md)] border px-4 py-3 text-left transition ${
              choice === opt.id
                ? "border-[var(--pg-v13-blue)] bg-[var(--pg-v13-panel)]"
                : "border-[var(--pg-v13-line-soft)] bg-transparent hover:bg-[var(--pg-v13-panel)]"
            }`}
            onClick={() => setChoice(opt.id)}
          >
            <p className="text-[14px] font-semibold text-[var(--pg-v13-ink)]">{opt.label}</p>
            <p className="text-[12px] text-[var(--pg-v13-ink-soft)]">{opt.desc}</p>
          </button>
        ))}

        {choice === "custom" ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Datum" : "Date"}
              </span>
              <input
                type="date"
                className="mt-1 w-full rounded-[var(--pg-radius-sm)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-bg)] px-3 py-2 text-[14px]"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                data-testid="schedule-custom-date"
              />
            </label>
            <label className="flex-1">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Tijd" : "Time"}
              </span>
              <input
                type="time"
                className="mt-1 w-full rounded-[var(--pg-radius-sm)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-bg)] px-3 py-2 text-[14px]"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                data-testid="schedule-custom-time"
              />
            </label>
          </div>
        ) : null}

        <div
          className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4"
          data-testid="schedule-preview"
        >
          <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
            {nl ? "Gepland voor" : "Scheduled for"}
          </p>
          <p className="mt-1 text-[15px] font-semibold text-[var(--pg-v13-ink)]">{previewLabel}</p>
          <p className="mt-1 text-[12px] text-[var(--pg-v13-ink-soft)]">{timezoneLabel}</p>
          {initialScheduledAt ? (
            <p className="mt-2 text-[12px] text-[var(--pg-v13-ink-faint)]">
              {nl ? "Huidige planning wordt overschreven." : "Current schedule will be overwritten."}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--pg-v13-line-soft)] px-7 py-4">
        <button type="button" className="pg-v13-btn" onClick={handleConfirm} data-testid="schedule-confirm">
          {nl ? "Campagne inplannen" : "Schedule campaign"}
        </button>
        <button type="button" className="pg-v13-btn pg-v13-btn--ghost ml-auto" onClick={onClose}>
          {nl ? "Annuleren" : "Cancel"}
        </button>
      </div>
    </PgVisionModal>
  );
}
