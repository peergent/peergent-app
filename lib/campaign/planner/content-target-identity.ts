/** Deterministic identity for campaign content targets (planner + executor dedupe). */
export function normalizeCampaignContentKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function campaignContentTargetKey(
  channel: string,
  deliverableType: string,
  planActivityReference?: string | null
): string {
  return [
    normalizeCampaignContentKeyPart(channel),
    normalizeCampaignContentKeyPart(deliverableType),
    normalizeCampaignContentKeyPart(planActivityReference ?? ""),
  ].join("|");
}

export function isGenericChannelPlaceholderDeliverableType(deliverableType: string): boolean {
  return normalizeCampaignContentKeyPart(deliverableType) === "generic";
}

export function channelHasConcreteContentTarget(
  channel: string,
  targets: readonly { readonly channel: string; readonly deliverableType: string }[]
): boolean {
  const normalizedChannel = normalizeCampaignContentKeyPart(channel);
  return targets.some(
    (target) =>
      normalizeCampaignContentKeyPart(target.channel) === normalizedChannel &&
      !isGenericChannelPlaceholderDeliverableType(target.deliverableType)
  );
}

/** Channel-only fallback title from planner (`${channel} deliverable`). */
export function isGenericChannelPlaceholderTitle(channel: string, title: string): boolean {
  const normalizedTitle = normalizeCampaignContentKeyPart(title);
  const normalizedChannel = normalizeCampaignContentKeyPart(channel);
  return normalizedTitle === `${normalizedChannel} deliverable`;
}
