import type { ContextBundle, PromptPackage, PromptSection } from "../types";

function sliceToSection(title: string, slice: ContextBundle["layers"][keyof ContextBundle["layers"]]): PromptSection | null {
  if (!slice) {
    return null;
  }

  return {
    title,
    body: JSON.stringify(slice.data, null, 2),
    sources: slice.sources,
  };
}

export function serializeContextBundle(bundle: ContextBundle): PromptPackage {
  const system: PromptSection[] = [];
  const context: PromptSection[] = [];
  const constraints: PromptSection[] = [];

  const identity = sliceToSection("Identity", bundle.layers.identity);
  const organization = sliceToSection("Organization", bundle.layers.organization);
  const objective = sliceToSection("Objective", bundle.layers.objective);
  const policy = sliceToSection("Policy", bundle.layers.policy);

  if (identity) system.push(identity);
  if (organization) context.push(organization);
  if (objective) context.push(objective);
  if (policy) constraints.push(policy);

  for (const [key, slice] of Object.entries(bundle.layers)) {
    if (["identity", "organization", "objective", "policy"].includes(key)) {
      continue;
    }

    const section = sliceToSection(key, slice);
    if (section) {
      context.push(section);
    }
  }

  return {
    system,
    context,
    constraints,
    traceId: bundle.meta.traceId,
  };
}
