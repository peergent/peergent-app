import type { HirePersonalisationAnswers } from "./hire-team-presenter";

export type HireBeat =
  | "welcome"
  | "intro"
  | "preparing"
  | "personalisation"
  | "creating"
  | "ready";

export type HireJourneyPersistedState = {
  hireOperationId: string;
  assessmentKey: string;
  beat: HireBeat;
  questionIndex: number;
  answers: HirePersonalisationAnswers;
  salesPeerId?: string;
  marketingPeerId?: string;
  hireComplete: boolean;
  startedAt: number;
};

export type HireLiveStatus = {
  label: string;
  peer?: "sales" | "marketing" | "shared" | "team";
  message: string;
};
