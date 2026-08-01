/** Channel monogram labels for Office content surfaces — no fake logos. */
export function channelMonogram(channelId: string | null, channelLabel: string | null): string {
  const id = (channelId ?? channelLabel ?? "").toLowerCase();
  if (id.includes("linkedin")) return "in";
  if (id.includes("google") && id.includes("ads")) return "Ads";
  if (id.includes("google")) return "G";
  if (id.includes("newsletter") || id.includes("email")) return "✉";
  if (id.includes("blog")) return "Bl";
  if (id.includes("meta") || id.includes("facebook") || id.includes("instagram")) return "Meta";
  if (channelLabel) return channelLabel.slice(0, 2).toUpperCase();
  return "—";
}
