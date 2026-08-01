"use client";

import Link from "next/link";
import PgVisionModal from "./PgVisionModal";

export type PgCampaignWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  campaignName: string;
  statusLabel: string;
  goal?: string;
  why?: string;
  peerId: string;
  projectId: string;
  onApproveAll?: () => void;
};

const CHECK = (
  <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden>
    <path
      d="M20 6L9 17l-5-5"
      fill="none"
      stroke="var(--pg-v13-success)"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TODO = (
  <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden>
    <circle
      cx="12"
      cy="12"
      r="8.5"
      fill="none"
      stroke="var(--pg-v13-ink-faint)"
      strokeWidth={2}
    />
  </svg>
);

export default function PgCampaignWorkspaceModal({
  open,
  onClose,
  locale,
  campaignName,
  statusLabel,
  goal,
  why,
  peerId,
  projectId,
  onApproveAll,
}: PgCampaignWorkspaceModalProps) {
  const nl = locale === "nl";
  const done = nl
    ? [
        "Doelgroep onderzocht",
        "Advertenties geschreven",
        "Afbeeldingen gemaakt",
        "Nieuwsbrief geschreven",
        "LinkedIn-posts gemaakt",
        "Google Ads-structuur opgezet",
      ]
    : [
        "Audience researched",
        "Ads written",
        "Images created",
        "Newsletter written",
        "LinkedIn posts created",
        "Google Ads structure set up",
      ];
  const todo = nl
    ? ["Goedkeuring headline", "Budget bevestigen", "Live zetten"]
    : ["Headline approval", "Confirm budget", "Go live"];

  return (
    <PgVisionModal open={open} onClose={onClose} size="workspace" testId="campaign-workspace-modal">
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Campagne" : "Campaign"}
            </p>
            <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">{campaignName}</h3>
            <p className="pg-v13-mono mt-2 flex items-center gap-2 text-[11px] font-bold text-[var(--pg-v13-attention)]">
              <span className="h-[7px] w-[7px] rounded-full bg-[var(--pg-v13-attention)]" />
              {statusLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] text-[var(--pg-v13-ink-soft)]"
            aria-label={nl ? "Sluiten" : "Close"}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-7 py-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.06em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Doel" : "Goal"}
            </p>
            <p className="mt-1 text-[13.5px] font-semibold leading-snug text-[var(--pg-v13-ink)]">
              {goal ?? (nl ? "Meer warmtepomp-offertes" : "More heat pump quotes")}
            </p>
          </div>
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.06em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Waarom" : "Why"}
            </p>
            <p className="mt-1 text-[13.5px] font-semibold leading-snug text-[var(--pg-v13-ink)]">
              {why ??
                (nl
                  ? "Routeplan draait dezelfde campagne — dit is het moment om te reageren."
                  : "Routeplan is running the same campaign — now is the time to respond.")}
            </p>
          </div>
        </div>

        <section className="mb-5">
          <p className="pg-v13-mono mb-3 text-[10px] font-bold tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
            {nl ? "Wat ik al gedaan heb" : "What I've already done"}
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {done.map((line) => (
              <li key={line} className="flex items-center gap-2 text-[13.5px] text-[var(--pg-v13-ink)]">
                {CHECK}
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-5">
          <p className="pg-v13-mono mb-3 text-[10px] font-bold tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
            {nl ? "Nog nodig" : "Still needed"}
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {todo.map((line) => (
              <li key={line} className="flex items-center gap-2 text-[13.5px] text-[var(--pg-v13-ink-soft)]">
                {TODO}
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <p className="pg-v13-mono mb-3 text-[10px] font-bold tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
            Preview
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { label: "LinkedIn", color: "#0A66C2" },
              { label: "Instagram", color: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)" },
              { label: "Google Ads", color: "#EFAA53" },
              { label: nl ? "Landingpage" : "Landing page", color: "var(--pg-v13-grad)" },
              { label: nl ? "Nieuwsbrief" : "Newsletter", color: "var(--pg-v13-ink-faint)" },
            ].map((chip) => (
              <div
                key={chip.label}
                className="w-[88px] shrink-0 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-2.5 py-2.5 text-center"
              >
                <div
                  className="mb-2 h-[38px] w-full rounded-[7px]"
                  style={{ background: chip.color }}
                />
                <div className="text-[10.5px] font-bold text-[var(--pg-v13-ink-soft)]">{chip.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-2">
          <button type="button" className="pg-v13-btn w-full" onClick={onApproveAll ?? onClose}>
            {nl ? "Keur alles goed" : "Approve all"}
          </button>
          <Link
            href={`/team/${peerId}/projects/${projectId}`}
            className="pg-v13-btn pg-v13-btn--ghost w-full text-center no-underline"
            onClick={onClose}
          >
            {nl ? "Open volledige campagne" : "Open full campaign"}
          </Link>
          <button
            type="button"
            className="border-none bg-transparent py-1 text-[13px] font-semibold text-[var(--pg-v13-ink-faint)]"
            onClick={onClose}
          >
            {nl ? "Vraag Emma iets" : "Ask Emma something"}
          </button>
        </div>
      </div>
    </PgVisionModal>
  );
}
