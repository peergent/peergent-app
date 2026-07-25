export type HandoffScene = "completed" | "urgent" | "calm" | "blocked" | "empty";

export type HandoffUrgency = "normal" | "urgent" | "calm" | "blocked";

export type HandoffWorkKind =
  | "strategy"
  | "plan"
  | "draft"
  | "publication"
  | "context"
  | "onboarding"
  | "workspace";

export type HandoffPrimaryWork = {
  id: string;
  title: string;
  peerName: string;
  peerId: string;
  completedAt: string | null;
  completedAtLabel: string | null;
  contextLine?: string;
  destination: string;
  kind: HandoffWorkKind;
};

export type HandoffSecondaryItem = {
  id: string;
  label: string;
  destination?: string;
};

export type HandoffSecondaryPriority = {
  id: string;
  title: string;
  subtitle: string;
  destination?: string;
  icon: "document" | "chart";
};

export type HandoffResponsiblePeer = {
  id: string;
  name: string;
  role: string;
};

export type HandoffCompanyActivity = {
  activeCount: number;
  intensity: "low" | "medium" | "high";
};

export type HandoffState = {
  scene: HandoffScene;
  /** @deprecated legacy — use personalGreeting + headline */
  greeting: string;
  /** @deprecated legacy — use headline */
  briefingLines: string[];
  waitLine?: string;
  personalGreeting: string;
  headline: string;
  categoryLabel: string;
  primaryWork: HandoffPrimaryWork | null;
  secondaryWork: HandoffSecondaryItem[];
  secondaryPriorities: HandoffSecondaryPriority[];
  urgency: HandoffUrgency;
  blockedReason?: string;
  responsiblePeer: HandoffResponsiblePeer | null;
  destination: string;
  companyActivity: HandoffCompanyActivity;
  teamWorkingVisible: boolean;
  /** True when served from ?handoff= or visual demo fixtures */
  isPreview?: boolean;
};

export type AdaptHandoffInput = {
  firstName?: string;
  peers: import("@/lib/peer-display").PeerRow[];
  marketingSnapshots: import("./types").HomePeerWorkspaceSnapshot[];
  understanding: import("@/lib/marketing-intelligence").MarketingUnderstanding | null;
  viewModel: import("./types").HomeViewModel;
  locale?: import("@/lib/i18n").HomeLocale;
};
