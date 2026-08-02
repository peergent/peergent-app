"use client";

import PgVisionModal from "@/components/design-system/PgVisionModal";

export type CampaignSetupMode = "automatic" | "manual";

export type CreateCampaignModeModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: CampaignSetupMode) => void;
  localePreference?: string | null;
};

export default function CreateCampaignModeModal({
  open,
  onClose,
  onSelect,
  localePreference,
}: CreateCampaignModeModalProps) {
  const nl = localePreference === "nl";

  return (
    <PgVisionModal open={open} onClose={onClose} size="preview" testId="create-campaign-mode-modal">
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <p className="pg-v13-mono text-[10px] tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
          {nl ? "Nieuwe campagne" : "New campaign"}
        </p>
        <h2 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">
          {nl ? "Hoe wil je starten?" : "How do you want to start?"}
        </h2>
        <p className="mt-2 text-[13.5px] text-[var(--pg-v13-ink-soft)]">
          {nl
            ? "Kies of Emma het campagneplan maakt, of jij zelf de richting bepaalt."
            : "Choose whether Emma designs the campaign or you set the direction."}
        </p>
      </div>

      <div className="space-y-3 px-7 py-6">
        <button
          type="button"
          className="w-full rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-5 text-left transition hover:border-[var(--pg-v13-blue)]"
          onClick={() => onSelect("automatic")}
          data-testid="campaign-mode-automatic"
        >
          <div className="flex items-start gap-3">
            <span className="text-[22px]" aria-hidden="true">
              🤖
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-[var(--pg-v13-ink)]">
                {nl ? "Laat Emma een campagne bedenken" : "Let Emma design a campaign"}
                <span className="ml-2 text-[11px] font-semibold text-[var(--pg-v13-blue)]">
                  ({nl ? "Aanbevolen" : "Recommended"})
                </span>
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
                {nl
                  ? "Vertel Emma alleen wat je wilt bereiken. Emma bepaalt vervolgens automatisch strategie, doelgroep, kanalen, deliverables, planning en publicatiemomenten."
                  : "Tell Emma only what you want to achieve. Emma then decides strategy, audience, channels, deliverables, planning, and publication timing."}
              </p>
              <span className="pg-v13-btn mt-4 inline-flex">{nl ? "Start automatisch" : "Start automatic"}</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          className="w-full rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-5 text-left transition hover:border-[var(--pg-v13-blue)]"
          onClick={() => onSelect("manual")}
          data-testid="campaign-mode-manual"
        >
          <div className="flex items-start gap-3">
            <span className="text-[22px]" aria-hidden="true">
              ✍️
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-[var(--pg-v13-ink)]">
                {nl ? "Zelf campagne opzetten" : "Set up the campaign yourself"}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
                {nl
                  ? "Bepaal zelf hoe de campagne eruit moet zien — doelen, kanalen, deliverables en planning."
                  : "Decide how the campaign should look — goals, channels, deliverables, and planning."}
              </p>
              <span className="pg-v13-btn pg-v13-btn--ghost mt-4 inline-flex">
                {nl ? "Start handmatig" : "Start manual"}
              </span>
            </div>
          </div>
        </button>
      </div>
    </PgVisionModal>
  );
}
