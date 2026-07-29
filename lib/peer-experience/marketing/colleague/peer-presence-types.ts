/** Customer-facing Peer presence (see PEERGENT_PRESENCE_MODEL.md). */
export type CustomerPeerPresenceState =
  | "needs_help"
  | "waiting_for_you"
  | "blocked"
  | "working"
  | "preparing"
  | "caught_up";

export type CustomerPeerPresenceViewModel = {
  state: CustomerPeerPresenceState;
  /** Maps to PeerPresenceKey / CSS where applicable */
  presentationKey:
    | "waiting_for_you"
    | "working"
    | "preparing"
    | "caught_up"
    | "needs_review";
  stateLabel: string;
  narrative: string;
  primaryActionHref: string | null;
  primaryActionLabel: string | null;
  lastMeaningfulUpdateLabel: string | null;
  showLiveIndicator: boolean;
};

export type PeerAttentionItemViewModel = {
  id: string;
  title: string;
  whyItMatters: string;
  primaryActionLabel: string;
  href: string;
  projectTitle?: string;
  ageLabel?: string;
  kind: "single" | "group";
  itemCount?: number;
  icon: "strategy" | "creative" | "content" | "plan" | "approval" | "connection";
};

export type PeerUpcomingWorkItem = {
  id: string;
  title: string;
  explanation: string;
  timingLabel: string | null;
  href: string | null;
};

export type PeerWorkingOnPrimaryAction = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type PeerWorkingOnViewModel = {
  mode: "focus" | "caught_up" | "waiting";
  focusLabel: string;
  focusTitle: string | null;
  description: string;
  stageLabel: string | null;
  progressLabel: string | null;
  nextStepLabel: string | null;
  nextStep: string | null;
  primaryAction: PeerWorkingOnPrimaryAction | null;
  upcoming: readonly PeerUpcomingWorkItem[];
  caughtUpLastOutcome: {
    title: string;
    href: string | null;
  } | null;
};

export type PeerCompletedOutcomeViewModel = {
  id: string;
  title: string;
  summary?: string;
  projectTitle?: string;
  completedAt: string;
  completedTimeLabel?: string;
  href?: string;
  group: "today" | "yesterday" | "this_week" | "older";
};
