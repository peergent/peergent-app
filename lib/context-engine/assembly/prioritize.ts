import type { ContextBundle } from "../types";

export function prioritizeContext(bundle: ContextBundle): ContextBundle {
  const peerTypeModulePriority = bundle.layers["peer-type"]?.priority ?? 0;
  if (peerTypeModulePriority > 0) {
    return bundle;
  }

  return bundle;
}
