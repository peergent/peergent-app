export type BrainSnapshot = {
  available: boolean;
  summary?: string;
  coveragePercent?: number;
  focusAreas?: string[];
};

export function toBrainSnapshot(input?: {
  summary?: string;
  coveragePercent?: number;
  focusAreas?: string[];
}): BrainSnapshot {
  if (!input) {
    return { available: false };
  }

  return {
    available: true,
    summary: input.summary,
    coveragePercent: input.coveragePercent,
    focusAreas: input.focusAreas,
  };
}
