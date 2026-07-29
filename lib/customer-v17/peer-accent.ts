import { V17_PEER_ACCENTS } from "@/lib/design-system/v17-customer-tokens";
import { getHqServiceKey, type HqServiceKey } from "@/lib/hq/hq-service-key";

export function v17AccentForServiceKey(key: HqServiceKey): string {
  switch (key) {
    case "marketing":
      return V17_PEER_ACCENTS.marketing;
    case "sales":
      return V17_PEER_ACCENTS.sales;
    case "support":
      return V17_PEER_ACCENTS.support;
    case "finance":
      return V17_PEER_ACCENTS.finance;
    case "operations":
      return V17_PEER_ACCENTS.operations;
    default:
      return V17_PEER_ACCENTS.default;
  }
}

export function v17ServiceKeyFromPeer(input: { role?: string | null; name?: string | null }): HqServiceKey {
  return getHqServiceKey({ role: input.role ?? "", name: input.name ?? "" }) ?? "operations";
}

export function v17PeerAccentClass(key: HqServiceKey): string {
  return `v17-accent--${key}`;
}
