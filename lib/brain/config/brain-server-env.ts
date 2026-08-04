import "server-only";

import { getOpenAIModel } from "@/lib/ai-runtime/env";
import { isBrainUseOpenAIEnabled } from "./brain-feature-flags";

export type BrainServerEnvSnapshot = {
  featureFlagEnabled: boolean;
  apiKeyPresent: boolean;
  resolvedModel: string;
};

/** Safe server-only snapshot — never exposes secrets. */
export function resolveBrainServerEnv(): BrainServerEnvSnapshot {
  return {
    featureFlagEnabled: isBrainUseOpenAIEnabled(),
    apiKeyPresent: Boolean(process.env.OPENAI_API_KEY?.trim()),
    resolvedModel: getOpenAIModel(),
  };
}

export function logBrainServerEnvResolved(scope: string): BrainServerEnvSnapshot {
  const snapshot = resolveBrainServerEnv();
  if (process.env.NODE_ENV !== "production") {
    console.info("[brain-server-env]", scope, {
      featureFlagEnabled: snapshot.featureFlagEnabled,
      apiKeyPresent: snapshot.apiKeyPresent,
      resolvedModel: snapshot.resolvedModel,
    });
  }
  return snapshot;
}
