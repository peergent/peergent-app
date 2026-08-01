"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import PgVisionModal from "@/components/design-system/PgVisionModal";
import type {
  CampaignDetailViewModel,
  CampaignWorkspaceItem,
} from "@/lib/office/campaign/build-campaign-detail";

export type CampaignWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  model: CampaignDetailViewModel;
  onApproveAll?: () => void;
  onItemAction?: (item: CampaignWorkspaceItem) => void;
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
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="var(--pg-v13-ink-faint)" strokeWidth={2} />
  </svg>
);

function WorkspaceRow({
  item,
  icon,
  onAction,
}: {
  item: CampaignWorkspaceItem;
  icon: ReactNode;
  onAction?: (item: CampaignWorkspaceItem) => void;
}) {
  const clickable = item.actionable && onAction;

  return (
    <li>
      <button
        type="button"
        className={
          clickable
            ? "flex w-full items-start gap-2 rounded-[var(--pg-radius-md)] px-1 py-1 text-left transition hover:bg-[var(--pg-v13-panel-hover)]"
            : "flex w-full items-start gap-2 px-1 py-1 text-left"
        }
        disabled={!clickable}
        onClick={() => clickable && onAction(item)}
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[13.5px] text-[var(--pg-v13-ink)]">{item.label}</span>
          {item.description ? (
            <span className="mt-0.5 block text-[12px] text-[var(--pg-v13-ink-soft)]">
              {item.description}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

export default function CampaignWorkspaceModal({
  open,
  onClose,
  locale,
  model,
  onApproveAll,
  onItemAction,
}: CampaignWorkspaceModalProps) {
  const router = useRouter();
  const nl = locale === "nl";

  const handleItem = (item: CampaignWorkspaceItem) => {
    if (onItemAction) {
      onItemAction(item);
      return;
    }
    if (item.detailHref) router.push(item.detailHref);
    else if (item.previewHref) router.push(item.previewHref);
    else if (item.reviewHref) router.push(item.reviewHref);
  };

  const hasPending = model.pending.length > 0;

  return (
    <PgVisionModal open={open} onClose={onClose} size="workspace" testId="campaign-workspace-modal">
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Campagne" : "Campaign"}
            </p>
            <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">{model.name}</h3>
            <p className="pg-v13-mono mt-2 flex items-center gap-2 text-[11px] font-bold text-[var(--pg-v13-attention)]">
              <span className="h-[7px] w-[7px] rounded-full bg-[var(--pg-v13-attention)]" />
              {model.statusLabel}
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
              {model.goal}
            </p>
          </div>
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.06em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Waarom" : "Why"}
            </p>
            <p className="mt-1 text-[13.5px] font-semibold leading-snug text-[var(--pg-v13-ink)]">
              {model.why}
            </p>
          </div>
        </div>

        {model.completed.length > 0 ? (
          <section className="mb-5">
            <p className="pg-v13-mono mb-3 text-[10px] font-bold tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Wat ik al gedaan heb" : "What I've already done"}
            </p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {model.completed.map((item) => (
                <WorkspaceRow
                  key={item.id}
                  item={item}
                  icon={CHECK}
                  onAction={item.actionable ? handleItem : undefined}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {model.pending.length > 0 ? (
          <section className="mb-5">
            <p className="pg-v13-mono mb-3 text-[10px] font-bold tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Nog nodig" : "Still needed"}
            </p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {model.pending.map((item) => (
                <WorkspaceRow
                  key={item.id}
                  item={item}
                  icon={TODO}
                  onAction={handleItem}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {model.previews.length > 0 ? (
          <section className="mb-6">
            <p className="pg-v13-mono mb-3 text-[10px] font-bold tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              Preview
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {model.previews.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-[88px] shrink-0 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-2.5 py-2.5 text-center transition hover:border-[var(--pg-v13-blue)]"
                  onClick={() => handleItem(item)}
                >
                  <div className="mb-2 flex h-[38px] w-full items-center justify-center rounded-[7px] bg-[var(--pg-v13-grad-soft)] text-[11px] font-bold text-[var(--pg-v13-blue)]">
                    {item.label.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-[10.5px] font-bold text-[var(--pg-v13-ink-soft)]">
                    {item.label}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex flex-col gap-2">
          {hasPending ? (
            <button type="button" className="pg-v13-btn w-full" onClick={onApproveAll ?? onClose}>
              {nl ? "Keur alles goed" : "Approve all"}
            </button>
          ) : null}
          <Link
            href={model.detailHref}
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
