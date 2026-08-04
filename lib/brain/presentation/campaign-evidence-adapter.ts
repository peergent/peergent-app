import type { CampaignEvidenceSection } from "@/lib/office/campaign/workflow-types";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import {
  filterLeakedOrganizationFacts,
} from "@/lib/office/campaign/campaign-brand-boundary";
import {
  type CreativeGenerationDeliverablePlan,
  channelLabelForPlan,
  deliverableTypeLabel,
} from "../llm/creative-generation-response-validator";
import { dedupeEvidenceItems } from "./dedupe-evidence-items";

export type CampaignEvidencePresentation = {
  title: string;
  intro?: string;
  sections: readonly CampaignEvidenceSection[];
};

export type CampaignEvidencePresentationContext = {
  usesExternalBrand?: boolean;
  accountOrganizationName?: string | null;
};

const INTERNAL_PATTERNS = [
  /^capabilityId:/i,
  /^provider:/i,
  /cache_hit/i,
  /ctx-[a-f0-9]+/i,
  /run-[a-z0-9-]+/i,
];

function sanitizeCustomerText(text: string): string {
  let value = text
    .replace(/linkedin_post|google_ads_campaign|creative_generation|channel_planning/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  for (const pattern of INTERNAL_PATTERNS) {
    if (pattern.test(value)) value = value.replace(pattern, "").trim();
  }
  return value.replace(/\(\s*\)/g, "").trim();
}

function parseDeliverablePlanFinding(value: string): CreativeGenerationDeliverablePlan | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed) as CreativeGenerationDeliverablePlan;
    } catch {
      return null;
    }
  }
  return null;
}

function formatLegacyDeliverableFinding(value: string, nl: boolean): string {
  const parts = value.split("|").map((p) => p.trim());
  const map = Object.fromEntries(
    parts.map((part) => {
      const idx = part.indexOf(":");
      if (idx < 0) return [part, ""];
      return [part.slice(0, idx).trim(), part.slice(idx + 1).trim()];
    })
  ) as Record<string, string>;

  const type = map.type ?? map.deliverableType ?? "Deliverable";
  const channel = map.channel ?? "unknown";
  const lines = [
    deliverableTypeLabel(type, nl),
    `${nl ? "Kanaal" : "Channel"}: ${channelLabelForPlan(channel, nl)}`,
    map.purpose ? `${nl ? "Doel" : "Purpose"}: ${map.purpose}` : null,
    map.message ? `${nl ? "Kernboodschap" : "Core message direction"}: ${map.message}` : null,
    map.review
      ? `${nl ? "Review" : "Review status"}: ${map.review === "required" ? (nl ? "Goedkeuring vereist" : "Approval required") : map.review}`
      : null,
  ].filter(Boolean);
  return lines.join("\n");
}

function formatDeliverablePlanItem(plan: CreativeGenerationDeliverablePlan, nl: boolean): string {
  const title = deliverableTypeLabel(plan.deliverableType ?? "campaign_concept", nl);
  const reviewLabel =
    plan.reviewStatus === "planned"
      ? nl
        ? "Gepland"
        : "Planned"
      : sanitizeCustomerText(plan.reviewStatus ?? (nl ? "Gepland" : "Planned"));

  return [
    title,
    `${nl ? "Kanaal" : "Channel"}: ${channelLabelForPlan(plan.channel ?? "", nl)}`,
    `${nl ? "Doel" : "Purpose"}: ${sanitizeCustomerText(plan.purpose ?? "")}`,
    `${nl ? "Kernboodschap" : "Core message direction"}: ${sanitizeCustomerText(plan.messageAngle ?? "")}`,
    plan.keyPoints?.length
      ? `${nl ? "Kernpunten" : "Key points"}: ${plan.keyPoints.map((point) => sanitizeCustomerText(point)).join("; ")}`
      : null,
    plan.callToActionDirection
      ? `${nl ? "CTA-richting" : "CTA direction"}: ${sanitizeCustomerText(plan.callToActionDirection)}`
      : null,
    `${nl ? "Waarom Emma dit aanbeveelt" : "Why Emma recommends it"}: ${sanitizeCustomerText(plan.rationale ?? "")}`,
    `${nl ? "Wat wordt geproduceerd" : "What will be produced"}: ${sanitizeCustomerText(plan.format ?? "")}`,
    `${nl ? "Review" : "Review status"}: ${reviewLabel}`,
  ]
    .filter((line) => line != null && line !== "" && !line.endsWith(": "))
    .join("\n");
}

const INTERNAL_WARNING_CODES = new Set(["generated_copy_in_plan"]);

function customerSafeCreativeWarnings(output: BrainStructuredOutput, nl: boolean): string[] {
  const hasPlanningOnly = output.warnings.some((warning) =>
    INTERNAL_WARNING_CODES.has(warning.code)
  );
  const messages = output.warnings
    .filter((warning) => !INTERNAL_WARNING_CODES.has(warning.code))
    .map((warning) => sanitizeCustomerText(warning.message));

  if (hasPlanningOnly) {
    messages.push(
      nl
        ? "Dit voorstel bevat plannen en richtingen. Nog geen definitieve advertentieteksten."
        : "This proposal contains plans and directions only. No final ad copy yet."
    );
  }

  return dedupeEvidenceItems(messages);
}

function presentCreativeGenerationEvidence(input: {
  output: BrainStructuredOutput;
  title: string;
  intro?: string;
  locale?: "nl" | "en";
  campaignContext?: CampaignEvidencePresentationContext;
}): CampaignEvidencePresentation {
  const nl = input.locale === "nl";
  const leakFilter = {
    usesExternalBrand: Boolean(input.campaignContext?.usesExternalBrand),
    accountOrganizationName: input.campaignContext?.accountOrganizationName ?? null,
  };

  const deliverableItems = input.output.findings
    .map((finding) => {
      const parsed = parseDeliverablePlanFinding(finding.value);
      if (parsed) return formatDeliverablePlanItem(parsed, nl);
      if (/^\s*Deliverable:/i.test(finding.value) || finding.value.includes("type:")) {
        return formatLegacyDeliverableFinding(finding.value, nl);
      }
      return sanitizeCustomerText(`${finding.label}: ${finding.value}`);
    })
    .filter(Boolean);

  const sections: CampaignEvidenceSection[] = [];
  if (deliverableItems.length > 0) {
    sections.push({
      id: "deliverables",
      title: nl ? "Geplande campagneonderdelen" : "Planned campaign deliverables",
      items: dedupeEvidenceItems(filterLeakedOrganizationFacts(deliverableItems, leakFilter)),
    });
  }

  if (input.output.recommendations.length > 0) {
    sections.push({
      id: "recommendations",
      title: nl ? "Aanbevelingen" : "Recommendations",
      items: dedupeEvidenceItems(
        filterLeakedOrganizationFacts(
          input.output.recommendations.map((r) => sanitizeCustomerText(r.label)),
          leakFilter
        )
      ),
    });
  }

  const warningItems = customerSafeCreativeWarnings(input.output, nl);
  if (warningItems.length > 0) {
    sections.push({
      id: "warnings",
      title: nl ? "Let op" : "Notes",
      items: warningItems,
    });
  }

  return {
    title: input.title,
    intro: input.intro,
    sections,
  };
}

/**
 * Maps structured Brain output → CampaignEvidenceSection for Vision v13 UI.
 * Narrative text is derived here — never stored in the core Brain model.
 */
export function presentBrainOutputForCampaign(input: {
  output: BrainStructuredOutput;
  title: string;
  intro?: string;
  locale?: "nl" | "en";
  findingsSectionTitle?: string;
  recommendationsSectionTitle?: string;
  campaignContext?: CampaignEvidencePresentationContext;
}): CampaignEvidencePresentation {
  const nl = input.locale === "nl";

  if (input.output.capabilityId === "creative_generation") {
    return presentCreativeGenerationEvidence(input);
  }

  const leakFilter = {
    usesExternalBrand: Boolean(input.campaignContext?.usesExternalBrand),
    accountOrganizationName: input.campaignContext?.accountOrganizationName ?? null,
  };
  const filterItems = (items: string[]) =>
    filterLeakedOrganizationFacts(items, leakFilter).map(sanitizeCustomerText).filter(Boolean);
  const findingsTitle = input.findingsSectionTitle ?? (nl ? "Bevindingen" : "Findings");
  const recommendationsTitle =
    input.recommendationsSectionTitle ?? (nl ? "Aanbevelingen" : "Recommendations");

  const sections: CampaignEvidenceSection[] = [];

  if (input.output.findings.length > 0) {
    const items = filterItems(
      input.output.findings.map((f) => `${f.label}: ${f.value}`)
    );
    if (items.length > 0) {
      sections.push({
        id: "findings",
        title: findingsTitle,
        items,
      });
    }
  }

  if (input.output.decisions.length > 0) {
    const items = filterItems(
      input.output.decisions.map((d) => `${d.label} — ${d.rationale}`)
    );
    if (items.length > 0) {
      sections.push({
        id: "decisions",
        title: nl ? "Beslissingen" : "Decisions",
        items,
      });
    }
  }

  if (input.output.recommendations.length > 0) {
    const seen = new Set<string>();
    const uniqueRecommendations = input.output.recommendations
      .map((r) => sanitizeCustomerText(r.label))
      .filter((label) => {
        const key = label.toLowerCase();
        if (!label || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    if (uniqueRecommendations.length > 0) {
      sections.push({
        id: "recommendations",
        title: recommendationsTitle,
        items: uniqueRecommendations,
      });
    }
  }

  if (input.output.warnings.length > 0) {
    sections.push({
      id: "warnings",
      title: nl ? "Let op" : "Notes",
      items: input.output.warnings.map((w) => sanitizeCustomerText(w.message)),
    });
  }

  const unknownWarnings = input.output.warnings.filter((w) =>
    /unknown|onbekend|missing|insufficient|nog nodig|still need/i.test(w.message)
  );
  if (unknownWarnings.length > 0) {
    sections.push({
      id: "unknowns",
      title: nl ? "Nog onbekend" : "Still unknown",
      items: unknownWarnings.map((w) => sanitizeCustomerText(w.message)),
    });
  }

  return {
    title: input.title,
    intro: input.intro,
    sections,
  };
}
