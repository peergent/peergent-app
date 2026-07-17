import { serializeContextBundle } from "../../../assembly/serialize";
import type { ContextBundle } from "../../../types";
import type { PromptPackage } from "../types";

export function formatContextAsMarkdown(bundle: ContextBundle): PromptPackage {
  const base = serializeContextBundle(bundle);

  return {
    ...base,
    context: base.context.map((section) => ({
      ...section,
      body: `## ${section.title}\n\n${section.body}`,
    })),
  };
}
