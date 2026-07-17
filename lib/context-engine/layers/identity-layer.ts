import type { ContextSlice } from "../types";

export function identityLayer(slice: ContextSlice<unknown>) {
  return slice;
}
