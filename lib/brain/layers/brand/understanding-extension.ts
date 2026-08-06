/**
 * Brand Understanding extension point — Sprint 10.0 stub.
 * Future: interpret research evidence into inferred brand characteristics.
 */

import type { BrandResearchGraph } from "./types";

export type BrandUnderstandingInput = {
  readonly researchGraph: BrandResearchGraph;
  readonly locale?: "nl" | "en";
};

export type BrandUnderstandingResult = {
  readonly implemented: false;
  readonly message: string;
};

export function buildBrandUnderstanding(
  _input: BrandUnderstandingInput
): BrandUnderstandingResult {
  return {
    implemented: false,
    message: "Brand Understanding layer is not implemented yet — Sprint 10.0 extension point.",
  };
}
