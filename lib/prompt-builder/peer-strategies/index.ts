import type { PeerRole } from "@/lib/context-engine/types";
import type { PeerPromptStrategy } from "./base";
import {
  fallbackPromptStrategy,
  marketingPromptStrategy,
  planningPromptStrategy,
  salesPromptStrategy,
  supportPromptStrategy,
} from "./strategies";

const STRATEGIES: Record<PeerRole, PeerPromptStrategy> = {
  Sales: salesPromptStrategy,
  Marketing: marketingPromptStrategy,
  Support: supportPromptStrategy,
  Planning: planningPromptStrategy,
  Finance: fallbackPromptStrategy,
  Custom: fallbackPromptStrategy,
};

export function resolvePeerStrategy(role: PeerRole): PeerPromptStrategy {
  return STRATEGIES[role] ?? fallbackPromptStrategy;
}

export {
  fallbackPromptStrategy,
  marketingPromptStrategy,
  planningPromptStrategy,
  salesPromptStrategy,
  supportPromptStrategy,
};
