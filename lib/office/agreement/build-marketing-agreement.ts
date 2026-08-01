import {
  resolveMarketingCampaignLocale,
  type MarketingCampaignLocale,
} from "@/lib/i18n/marketing-campaign-copy";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  MarketingResponsibility,
  MarketingResponsibilityGuardrails,
} from "@/lib/peer-experience/marketing/responsibilities/types";
import { toOfficeHref } from "../links";
import type {
  AgreementBoundary,
  AgreementConnection,
  AgreementCopy,
  AgreementGuardrail,
  AgreementHistoryEntry,
  AgreementKnowledge,
  AgreementViewModel,
  BoundaryKind,
} from "./types";

export type KnowledgeAmendments = {
  overrides: Record<string, { value: string; correctedBy: string }>;
  additions: AgreementKnowledge[];
};

export function applyKnowledgeAmendments(
  model: AgreementViewModel,
  amendments: KnowledgeAmendments | null | undefined
): AgreementViewModel {
  if (!amendments) return model;

  const knowledge = model.knowledge.map((entry) => {
    const override = amendments.overrides[entry.id];
    if (!override) return entry;
    return {
      ...entry,
      value: override.value,
      provenance: "customer_rule" as const,
      correctedBy: override.correctedBy,
      correctable: true,
    };
  });

  const existingIds = new Set(knowledge.map((entry) => entry.id));
  for (const addition of amendments.additions) {
    if (!existingIds.has(addition.id)) {
      knowledge.push(addition);
      existingIds.add(addition.id);
    }
  }

  const hasLearned = knowledge.some(
    (entry) =>
      entry.provenance === "emma_understanding" || entry.provenance === "customer_rule"
  );

  return {
    ...model,
    knowledge,
    noLearnedUnderstanding: hasLearned ? null : model.noLearnedUnderstanding,
  };
}

/**
 * Marketing adapter for the working agreement (§4.8).
 *
 * `MarketingResponsibility` is already the canonical autonomy record — it
 * carries `autonomyLevel`, `approvalPolicy`, `guardrails` and its own
 * timestamps. Nothing about autonomy is re-modelled here; this maps that record
 * onto boundaries and states each one's consequence in plain language.
 */

function copyFor(locale: MarketingCampaignLocale): AgreementCopy {
  if (locale === "nl") {
    return {
      title: "Werkafspraak",
      subtitle: "Wat ik zelf mag doen, wat ik altijd eerst vraag, en wat ik nooit doe.",
      autonomousHeading: "Doe ik zelf",
      needsApprovalHeading: "Vraag ik altijd eerst",
      neverHeading: "Doe ik niet",
      knowledgeHeading: "Wat ik weet",
      connectionsHeading: "Waar ik bij kan",
      historyHeading: "Wat er is veranderd",
      provenanceSystem: "Systeem",
      provenanceCustomer: "Door jou ingesteld",
      provenanceEmma: "Mijn beeld",
      correctLabel: "Corrigeer dit",
      correctedLabel: (by) => `Door jou gecorrigeerd: ${by}`,
      consequenceLabel: "Wat dit betekent",
      reversalLabel: "Terugdraaien",
      confirmLabel: "Ja, zo instellen",
      cancelLabel: "Laat maar",
      savingLabel: "Opslaan…",
      savedLabel: "Opgeslagen",
      connectedLabel: "Gekoppeld",
      notConnectedLabel: "Niet gekoppeld",
      lastChangedLabel: (when) => `Gewijzigd ${when}`,
      narrowLabel: "Vraag het me eerst",
      widenLabel: "Doe dit zelf",
    };
  }
  return {
    title: "Working agreement",
    subtitle: "What I do alone, what I always ask about first, and what I don't do.",
    autonomousHeading: "I handle these",
    needsApprovalHeading: "I always ask first",
    neverHeading: "I don't do these",
    knowledgeHeading: "What I know",
    connectionsHeading: "What I can reach",
    historyHeading: "What's changed",
    provenanceSystem: "System",
    provenanceCustomer: "You set this",
    provenanceEmma: "My read",
    correctLabel: "Correct this",
    correctedLabel: (by) => `You corrected this: ${by}`,
    consequenceLabel: "What this means",
    reversalLabel: "How to undo",
    confirmLabel: "Yes, set it that way",
    cancelLabel: "Leave it",
    savingLabel: "Saving…",
    savedLabel: "Saved",
    connectedLabel: "Connected",
    notConnectedLabel: "Not connected",
    lastChangedLabel: (when) => `Changed ${when}`,
    narrowLabel: "Ask me first",
    widenLabel: "Handle this yourself",
  };
}

/**
 * Maps the canonical autonomy record onto one of three boundaries.
 * A disabled responsibility is a "never", whatever its configured level.
 */
function boundaryKindFor(responsibility: MarketingResponsibility): BoundaryKind {
  if (!responsibility.enabled || responsibility.status === "disabled") return "never";
  if (responsibility.approvalPolicy === "fully_automatic") return "autonomous";
  if (responsibility.approvalPolicy === "prepare_only") return "needs_approval";
  if (responsibility.guardrails?.approvalRequired) return "needs_approval";
  return responsibility.autonomyLevel === "autonomous" ||
    responsibility.autonomyLevel === "full"
    ? "autonomous"
    : "needs_approval";
}

/** Guardrails become plain statements rather than key-value settings. */
function guardrailsFor(
  guardrails: MarketingResponsibilityGuardrails | undefined,
  locale: MarketingCampaignLocale
): AgreementGuardrail[] {
  if (!guardrails) return [];
  const nl = locale === "nl";
  const out: AgreementGuardrail[] = [];

  if (typeof guardrails.maxMonthlySpend === "number") {
    out.push({
      id: "max-spend",
      label: nl ? "Uitgaven" : "Spending",
      value: nl
        ? `Tot €${guardrails.maxMonthlySpend} per maand zonder te vragen`
        : `Up to €${guardrails.maxMonthlySpend} a month without asking`,
    });
  }
  if (typeof guardrails.maxPostsPerWeek === "number") {
    out.push({
      id: "max-posts",
      label: nl ? "Volume" : "Volume",
      value: nl
        ? `Maximaal ${guardrails.maxPostsPerWeek} publicaties per week`
        : `At most ${guardrails.maxPostsPerWeek} publications a week`,
    });
  }
  if (guardrails.brandTone) {
    out.push({
      id: "tone",
      label: nl ? "Toon" : "Tone",
      value: guardrails.brandTone,
    });
  }
  if (guardrails.imageGenerationPolicy) {
    const policy = {
      always: nl ? "Altijd beeld maken" : "Always make visuals",
      when_needed: nl ? "Beeld alleen als het nodig is" : "Visuals only when needed",
      never: nl ? "Nooit zelf beeld maken" : "Never make visuals",
    }[guardrails.imageGenerationPolicy];
    out.push({ id: "visuals", label: nl ? "Beeld" : "Visuals", value: policy });
  }
  return out;
}

/**
 * Lower-casing a title mid-sentence mangles proper nouns — "linkedin posting",
 * "google ads budget changes". Only the first character is safe to fold, and
 * only when the rest of the word is not already carrying capitals of its own.
 */
function titleInSentence(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return trimmed;
  const [first, ...rest] = trimmed.split(" ");
  const foldFirst = first === first.toUpperCase() || /[A-Z]/.test(first.slice(1))
    ? first
    : first.toLowerCase();
  return [foldFirst, ...rest].join(" ");
}

/**
 * Where the result of an autonomous action shows up. Content is where most of
 * her output lands, but not all of it — saying "under Content" for competitor
 * monitoring would point the customer at the wrong page.
 */
function surfaceForCategory(
  category: MarketingResponsibility["category"],
  locale: MarketingCampaignLocale
): string {
  const nl = locale === "nl";
  switch (category) {
    case "competitor_monitoring":
      return nl ? "Markt" : "Market";
    case "google_ads":
    case "meta_ads":
      return nl ? "Prestaties" : "Performance";
    default:
      return nl ? "Content" : "Content";
  }
}

function consequenceFor(
  kind: BoundaryKind,
  title: string,
  surface: string,
  locale: MarketingCampaignLocale
): string {
  const nl = locale === "nl";
  const subject = titleInSentence(title);
  switch (kind) {
    case "autonomous":
      return nl
        ? `Ik voer ${subject} uit zonder het eerst te vragen. Je ziet het achteraf terug bij ${surface}.`
        : `I'll carry out ${subject} without asking first. You'll see it afterwards under ${surface}.`;
    case "needs_approval":
      return nl
        ? `Ik bereid ${subject} voor en stop dan. Er gebeurt niets tot jij akkoord geeft.`
        : `I'll prepare ${subject} and then stop. Nothing happens until you say yes.`;
    case "never":
    default:
      return nl
        ? `Ik raak ${subject} niet aan. Ik stel het ook niet voor.`
        : `I won't touch ${subject} at all, and I won't propose it either.`;
  }
}

function reversalFor(kind: BoundaryKind, locale: MarketingCampaignLocale): string {
  const nl = locale === "nl";
  if (kind === "autonomous") {
    return nl
      ? "Je kunt dit altijd terugzetten naar 'vraag het me eerst'. Werk dat al loopt blijft staan."
      : "You can always set this back to 'ask me first'. Work already under way is kept.";
  }
  return nl
    ? "Je kunt dit later verruimen. Er gaat niets verloren."
    : "You can widen this later. Nothing is lost either way.";
}

export function buildMarketingAgreementViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  peerName: string;
  peerRole: string;
  localePreference?: string | null;
}): AgreementViewModel {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const copy = copyFor(locale);
  const nl = locale === "nl";
  const { domainInput } = input;
  const peerId = domainInput.peerId;

  // ---- Boundaries, from the canonical autonomy record --------------------
  const boundaries: AgreementBoundary[] = domainInput.responsibilities.map(
    (responsibility) => {
      const kind = boundaryKindFor(responsibility);
      return {
        id: responsibility.id,
        title: responsibility.title,
        description: responsibility.description,
        kind,
        consequence: consequenceFor(
          kind,
          responsibility.title,
          surfaceForCategory(responsibility.category, locale),
          locale
        ),
        reversal: reversalFor(kind, locale),
        enabled: responsibility.enabled,
        lastChangedAt: responsibility.updatedAt ?? null,
        lastChangedLabel: responsibility.updatedAt
          ? copy.lastChangedLabel(formatRelativeTime(responsibility.updatedAt, locale))
          : null,
        guardrails: guardrailsFor(responsibility.guardrails, locale),
      };
    }
  );

  const autonomous = boundaries.filter((b) => b.kind === "autonomous");
  const needsApproval = boundaries.filter((b) => b.kind === "needs_approval");
  const never = boundaries.filter((b) => b.kind === "never");

  // ---- Knowledge, split by provenance ------------------------------------
  const knowledge: AgreementKnowledge[] = [];
  const brand = domainInput.understanding?.brand;

  // Emma's own reading, derived from recorded business knowledge.
  if (brand?.toneOfVoice?.summary) {
    knowledge.push({
      id: "tone",
      label: nl ? "Hoe jullie klinken" : "How you sound",
      value: brand.toneOfVoice.summary,
      provenance: "emma_understanding",
      correctable: true,
      correctedBy: null,
    });
  }
  if (brand?.positioningStatement) {
    knowledge.push({
      id: "positioning",
      label: nl ? "Hoe jullie je positioneren" : "How you position",
      value: brand.positioningStatement,
      provenance: "emma_understanding",
      correctable: true,
      correctedBy: null,
    });
  }
  if (brand?.keyMessages?.length) {
    knowledge.push({
      id: "claims",
      label: nl ? "Kernclaims" : "Key claims",
      value: brand.keyMessages.join(" · "),
      provenance: "emma_understanding",
      correctable: true,
      correctedBy: null,
    });
  }
  if (brand?.toneOfVoice?.dos?.length || brand?.toneOfVoice?.donts?.length) {
    const dos = brand.toneOfVoice.dos?.join(", ") ?? "";
    const donts = brand.toneOfVoice.donts?.join(", ") ?? "";
    knowledge.push({
      id: "tone-rules",
      label: nl ? "Tone of voice regels" : "Tone of voice rules",
      value: nl
        ? `Wel: ${dos || "—"}. Niet: ${donts || "—"}.`
        : `Do: ${dos || "—"}. Don't: ${donts || "—"}.`,
      provenance: "emma_understanding",
      correctable: true,
      correctedBy: null,
    });
  }
  if (brand?.marketCategory) {
    knowledge.push({
      id: "market-category",
      label: nl ? "Marktcategorie" : "Market category",
      value: brand.marketCategory,
      provenance: "emma_understanding",
      correctable: true,
      correctedBy: null,
    });
  }
  if (brand?.tagline) {
    knowledge.push({
      id: "tagline",
      label: nl ? "Tagline" : "Tagline",
      value: brand.tagline,
      provenance: "emma_understanding",
      correctable: true,
      correctedBy: null,
    });
  }

  const competitors = domainInput.understanding?.competitors ?? [];
  for (const competitor of competitors.slice(0, 4)) {
    knowledge.push({
      id: `competitor:${competitor.id ?? competitor.name}`,
      label: nl ? `Concurrent: ${competitor.name}` : `Competitor: ${competitor.name}`,
      value: [...competitor.strengths, ...competitor.differentiators].filter(Boolean).join(" · ") || competitor.name,
      provenance: "emma_understanding",
      correctable: true,
      correctedBy: null,
    });
  }

  const products = domainInput.understanding?.products ?? [];
  for (const product of products.slice(0, 4)) {
    knowledge.push({
      id: `product:${product.id ?? product.name}`,
      label: nl ? `Product: ${product.name}` : `Product: ${product.name}`,
      value: product.description ?? product.name,
      provenance: "emma_understanding",
      correctable: false,
      correctedBy: null,
    });
  }

  // Explicit customer rules, taken from guardrails actually set.
  for (const boundary of boundaries) {
    for (const guardrail of boundary.guardrails) {
      knowledge.push({
        id: `rule:${boundary.id}:${guardrail.id}`,
        label: guardrail.label,
        value: guardrail.value,
        provenance: "customer_rule",
        // A rule the customer set is changed on the boundary, not corrected here.
        correctable: false,
        correctedBy: null,
      });
    }
  }

  // Objective system facts.
  knowledge.push({
    id: "role",
    label: nl ? "Rol" : "Role",
    value: input.peerRole,
    provenance: "system_fact",
    correctable: false,
    correctedBy: null,
  });

  const hasLearned = knowledge.some((k) => k.provenance === "emma_understanding");

  // ---- Access — only real connections, never placeholders ---------------
  const connections: AgreementConnection[] = domainInput.connections.map(
    (connection) => ({
      id: connection.id,
      label: connection.label,
      connected: connection.status === "connected",
      statusLabel:
        connection.status === "connected"
          ? copy.connectedLabel
          : connection.status === "needs_reconnect"
            ? nl
              ? "Verbinding verlopen"
              : "Connection expired"
            : copy.notConnectedLabel,
      unlocks:
        connection.status === "connected"
          ? nl
            ? "Ik kan hier publiceren en meelezen."
            : "I can publish here and read back."
          : nl
            ? "Zonder koppeling kan ik hier niets publiceren of meten."
            : "Without this I can't publish here or measure anything.",
      href: toOfficeHref(peerId, connection.settingsHref),
    })
  );

  // ---- Reversible history, from the records' own timestamps -------------
  const history: AgreementHistoryEntry[] = boundaries
    .filter((b) => b.lastChangedAt)
    .sort((a, b) => (a.lastChangedAt! < b.lastChangedAt! ? 1 : -1))
    .slice(0, 8)
    .map((boundary) => ({
      id: `history:${boundary.id}`,
      label: nl
        ? `${boundary.title} — ${
            boundary.kind === "autonomous"
              ? "doe ik zelf"
              : boundary.kind === "needs_approval"
                ? "vraag ik eerst"
                : "doe ik niet"
          }`
        : `${boundary.title} — ${
            boundary.kind === "autonomous"
              ? "I handle it"
              : boundary.kind === "needs_approval"
                ? "I ask first"
                : "I don't do it"
          }`,
      at: boundary.lastChangedAt!,
      atLabel: formatRelativeTime(boundary.lastChangedAt!, locale),
    }));

  // ---- Presence — states the current boundary, never lobbies ------------
  const presence: AgreementViewModel["presence"] =
    boundaries.length === 0
      ? {
          rung: "orientation",
          text: nl
            ? "We hebben nog geen afspraken vastgelegd. Tot die er zijn vraag ik alles eerst."
            : "We haven't set any boundaries yet. Until we do, I ask about everything first.",
          working: false,
        }
      : {
          rung: "observation",
          text: nl
            ? autonomous.length === 0
              ? "Ik vraag op dit moment overal eerst toestemming voor."
              : `Ik doe ${autonomous.length} ${autonomous.length === 1 ? "ding" : "dingen"} zelf. De rest leg ik eerst aan je voor.`
            : autonomous.length === 0
              ? "Right now I ask you about everything before I act."
              : `I handle ${autonomous.length} ${autonomous.length === 1 ? "thing" : "things"} on my own. Everything else comes to you first.`,
          working: false,
        };

  return {
    peerId,
    peerName: input.peerName,
    peerRole: input.peerRole,
    presence,
    autonomous,
    needsApproval,
    never,
    knowledge,
    connections,
    history,
    noLearnedUnderstanding: hasLearned
      ? null
      : nl
        ? "Ik heb nog geen beeld opgebouwd van hoe jullie klinken. Dat komt zodra we samen werk hebben gedaan."
        : "I haven't built up a read on how you sound yet. That comes once we've done some work together.",
    empty:
      boundaries.length === 0
        ? {
            voice: nl
              ? "We hebben nog geen werkafspraken."
              : "We haven't set a working agreement yet.",
            next: nl
              ? "Tot die er zijn vraag ik alles eerst aan je."
              : "Until we do, I'll ask you about everything first.",
          }
        : null,
    copy,
  };
}
