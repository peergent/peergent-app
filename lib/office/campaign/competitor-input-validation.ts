import { normalizeCampaignCompetitorUrl } from "@/lib/office/campaign/live-campaign-context-store";

export type CampaignCompetitorInput = {
  name: string;
  url?: string;
};

export type CompetitorRowValidation = {
  nameError?: string;
  urlError?: string;
};

export function validateCompetitorRow(
  name: string,
  url: string,
  nl: boolean
): CompetitorRowValidation {
  const trimmedName = name.trim();
  const trimmedUrl = url.trim();

  if (!trimmedName && !trimmedUrl) {
    return {};
  }

  if (!trimmedName) {
    return { nameError: nl ? "Vul een naam in." : "Enter a name." };
  }

  if (trimmedUrl) {
    const normalized = normalizeCampaignCompetitorUrl(trimmedUrl);
    if (!normalized) {
      return {
        urlError: nl
          ? "Deze website-URL lijkt niet geldig. Gebruik bijvoorbeeld https://voorbeeld.nl"
          : "This website URL does not look valid. Try https://example.com",
      };
    }
  }

  return {};
}

export function validateCompetitorInputs(
  rows: readonly { name: string; url: string }[],
  nl: boolean
): {
  rowErrors: Record<number, CompetitorRowValidation>;
  validEntries: CampaignCompetitorInput[];
  hasErrors: boolean;
} {
  const rowErrors: Record<number, CompetitorRowValidation> = {};
  const validEntries: CampaignCompetitorInput[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!;
    const errors = validateCompetitorRow(row.name, row.url, nl);
    if (errors.nameError || errors.urlError) {
      rowErrors[index] = errors;
      continue;
    }

    const trimmedName = row.name.trim();
    const trimmedUrl = row.url.trim();
    if (!trimmedName) continue;

    validEntries.push({
      name: trimmedName,
      url: trimmedUrl ? normalizeCampaignCompetitorUrl(trimmedUrl) ?? undefined : undefined,
    });
  }

  return {
    rowErrors,
    validEntries,
    hasErrors: Object.keys(rowErrors).length > 0,
  };
}
