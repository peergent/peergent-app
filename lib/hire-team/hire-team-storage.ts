import type { WebsiteIntelligenceAssessment } from "@/lib/website-intelligence";
import type { HireJourneyPersistedState } from "./types";

const JOURNEY_KEY = "peergent-hire-journey";
const ASSESSMENT_KEY = "peergent-hire-assessment";
const JOURNEY_TTL_MS = 1000 * 60 * 60 * 4;

export function assessmentStorageKey(assessment: WebsiteIntelligenceAssessment): string {
  return `${assessment.meta.url}::${assessment.meta.analyzedAt}`;
}

export function saveAssessmentForHire(assessment: WebsiteIntelligenceAssessment) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ASSESSMENT_KEY, JSON.stringify(assessment));
}

export function loadAssessmentForHire(): WebsiteIntelligenceAssessment | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ASSESSMENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WebsiteIntelligenceAssessment;
  } catch {
    return null;
  }
}

export function saveHireJourney(state: HireJourneyPersistedState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(state));
}

export function loadHireJourney(): HireJourneyPersistedState | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(JOURNEY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as HireJourneyPersistedState;
    if (Date.now() - parsed.startedAt > JOURNEY_TTL_MS) {
      clearHireJourney();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Returns journey state only when it matches the stored assessment snapshot. */
export function loadHireJourneyForAssessment(
  assessment: WebsiteIntelligenceAssessment
): HireJourneyPersistedState | null {
  const journey = loadHireJourney();
  if (!journey) return null;
  if (journey.assessmentKey !== assessmentStorageKey(assessment)) {
    sessionStorage.removeItem(JOURNEY_KEY);
    return null;
  }
  return journey;
}

export function clearHireJourney() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(JOURNEY_KEY);
  sessionStorage.removeItem(ASSESSMENT_KEY);
}

export function createHireOperationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `hire-${Date.now()}`;
}
