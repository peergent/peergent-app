export function deliverablePreviewCtaLabel(channelId: string, nl: boolean): string {
  const map: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "View LinkedIn post", nl: "Bekijk LinkedIn-post" },
    email: { en: "View acquisition email", nl: "Bekijk acquisitie-e-mail" },
    newsletter: { en: "View newsletter", nl: "Bekijk nieuwsbrief" },
    google_ads: { en: "View ad", nl: "Bekijk advertentie" },
    website_landing: { en: "View landing page", nl: "Bekijk landingspagina" },
    instagram: { en: "View Instagram post", nl: "Bekijk Instagram-post" },
    blog: { en: "View blog article", nl: "Bekijk blogartikel" },
  };
  return map[channelId]?.[nl ? "nl" : "en"] ?? (nl ? "Bekijk content" : "View content");
}

export function evidenceApprovalRequired(
  stepId: string,
  executionMode: "manual" | "semi_automatic" | "fully_automatic"
): boolean {
  if (executionMode === "fully_automatic") return false;
  if (executionMode === "semi_automatic") {
    return stepId === "deliverables_created";
  }
  return (
    stepId === "strategy_determined" ||
    stepId === "channels_selected" ||
    stepId === "deliverables_created"
  );
}
