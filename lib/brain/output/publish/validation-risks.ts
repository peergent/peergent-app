import type { ValidationGraph } from "@/lib/brain/layers/validation/types";
import type { BusinessRisk } from "../types";
import { sanitizeCustomerText } from "../sanitize";

/** Map validation business and brand risks — meaningful risks only. */
export function publishValidationBusinessRisks(input: {
  validation: ValidationGraph | null;
}): readonly BusinessRisk[] {
  if (!input.validation) return [];

  const report = input.validation.report;
  const risks: BusinessRisk[] = [];

  for (const risk of report.businessRisks.slice(0, 3)) {
    const description = sanitizeCustomerText(risk.risk);
    if (!description) continue;
    risks.push({
      id: `val-biz-${risk.id}`,
      title: "Risk",
      description,
      mitigation: sanitizeCustomerText(risk.mitigation),
      source: "validation",
    });
  }

  for (const risk of report.brandRisks.slice(0, 2)) {
    const description = sanitizeCustomerText(risk.risk);
    if (!description) continue;
    risks.push({
      id: `val-brand-${risk.id}`,
      title: "Brand risk",
      description,
      mitigation: sanitizeCustomerText(risk.mitigation),
      source: "validation",
    });
  }

  return risks;
}
