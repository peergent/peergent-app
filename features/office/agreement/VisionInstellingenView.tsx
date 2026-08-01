"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type AgreementViewProps } from "./AgreementView";
import VisionAgreementDetailView from "./VisionAgreementDetailView";

export type InstellingenSectionId =
  | "brand"
  | "connections"
  | "responsibilities"
  | "autonomy"
  | "agreement"
  | "knowledge";

export type VisionInstellingenViewProps = AgreementViewProps & {
  locale?: string | null;
  peerId: string;
};

const SECTIONS: InstellingenSectionId[] = [
  "brand",
  "connections",
  "responsibilities",
  "autonomy",
  "agreement",
  "knowledge",
];

function parseSection(raw: string | null): InstellingenSectionId | null {
  if (!raw) return null;
  return SECTIONS.includes(raw as InstellingenSectionId)
    ? (raw as InstellingenSectionId)
    : null;
}

function skillChips(model: AgreementViewProps["model"]): string[] {
  const fromBoundaries = [...model.autonomous, ...model.needsApproval]
    .filter((b) => b.enabled)
    .map((b) => b.title);
  if (fromBoundaries.length > 0) return fromBoundaries.slice(0, 8);
  return model.knowledge.slice(0, 6).map((k) => k.label);
}

/**
 * Vision v13 Instellingen — overview rows navigate to focused section views.
 */
export default function VisionInstellingenView({
  model,
  locale,
  peerId,
  ...agreementProps
}: VisionInstellingenViewProps) {
  const nl = locale === "nl";
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = parseSection(searchParams.get("section"));
  const skills = skillChips(model);

  const rows: {
    id: InstellingenSectionId;
    name: string;
    desc: string;
  }[] = [
    {
      id: "brand",
      name: nl ? "Merkkennis" : "Brand knowledge",
      desc: nl
        ? "Tone of voice, kleuren, claims en beeldstijl"
        : "Tone of voice, colors, claims and visual style",
    },
    {
      id: "connections",
      name: nl ? "Koppelingen" : "Connections",
      desc:
        model.connections.length > 0
          ? model.connections.map((c) => c.label).join(", ")
          : nl
            ? "Meta Ads, Google Ads, HubSpot, GA4"
            : "Meta Ads, Google Ads, HubSpot, GA4",
    },
    {
      id: "responsibilities",
      name: nl ? "Verantwoordelijkheden" : "Responsibilities",
      desc: nl ? "Welke campagnes en kanalen" : "Which campaigns and channels",
    },
    {
      id: "autonomy",
      name: nl ? "Zelfstandigheid" : "Autonomy",
      desc: nl ? "Wat mag zonder jouw goedkeuring" : "What may happen without your approval",
    },
    {
      id: "agreement",
      name: nl ? "Werkafspraak" : "Working agreement",
      desc: nl ? "Regels, grenzen en guardrails" : "Rules, boundaries and guardrails",
    },
    {
      id: "knowledge",
      name: nl ? "Wat Emma weet" : "What Emma knows",
      desc: nl ? "Feiten, regels en afgeleid begrip" : "Facts, rules and derived understanding",
    },
  ];

  if (activeSection) {
    const row = rows.find((r) => r.id === activeSection);
    return (
      <div data-testid="office-instellingen-view" className="pg-v13-settings-detail">
        <button
          type="button"
          className="pg-v13-btn pg-v13-btn--ghost mb-8"
          onClick={() => router.push(`/office/${peerId}/agreement`)}
        >
          {nl ? "← Terug naar Instellingen" : "← Back to Settings"}
        </button>
        <p className="pg-v13-eyebrow">{nl ? "Instellingen" : "Settings"}</p>
        <h2 className="pg-v13-settings-detail-title">{row?.name}</h2>
        <p className="pg-v13-settings-detail-desc">{row?.desc}</p>
        <div className="pg-v13-settings-detail-body">
          <VisionAgreementDetailView
            model={model}
            {...agreementProps}
            visibleSection={activeSection}
          />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="office-instellingen-view">
      {skills.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Vaardigheden" : "Skills"}</p>
          <div className="pg-v13-chip-list">
            {skills.map((chip) => (
              <span key={chip} className="pg-v13-chip">
                {chip}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="pg-v13-sec">
        <p className="pg-v13-sec-label">{nl ? "Beheer" : "Manage"}</p>
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/office/${peerId}/agreement?section=${row.id}`}
            className="pg-v13-settings-row pg-v13-settings-row--link no-underline"
          >
            <div>
              <div className="pg-v13-settings-name">{row.name}</div>
              <div className="pg-v13-settings-desc">{row.desc}</div>
            </div>
            <span className="text-[var(--pg-v13-ink-faint)]" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
