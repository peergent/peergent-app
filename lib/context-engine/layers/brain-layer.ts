import type { BrainSnapshot } from "../adapters/brain/business-brain-adapter";
import type { ContextSlice } from "../types";

export function brainLayer(slice: ContextSlice<BrainSnapshot>) {
  return slice;
}
