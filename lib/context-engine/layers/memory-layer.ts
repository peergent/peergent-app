import type { ContextSlice } from "../types";

export function memoryLayer(slice: ContextSlice<unknown>) {
  return slice;
}
