export type PeerWorkState = "working" | "idle" | "paused";

export type AvailabilityMode = "business-hours" | "extended" | "24-7";

export type AutonomyLevel = "assist" | "collaborate" | "autopilot";

export type WorkConfidence = "High" | "Medium" | "Low" | "Ready";

export type PeerWorkspaceHeaderModel = {
  peerName: string;
  role: string;
  department: string;
  roleDescription: string;
  gradient: string;
  workState: PeerWorkState;
  statusLabel: string;
};

export type CurrentWorkModel = {
  isActive: boolean;
  objective: string;
  reasoning: string;
  confidence: WorkConfidence;
  waitingFor: string;
  estimatedCompletion: string;
};

export type DecisionLogEntry = {
  id: string;
  time: string;
  explanation: string;
};

export type LearningItem = {
  id: string;
  text: string;
};

export type ApprovalItem = {
  id: string;
  title: string;
  context: string;
  reason: string;
  requestedAt: string;
};

export type AvailabilityOption = {
  id: AvailabilityMode;
  label: string;
  description: string;
};

export type AutonomyOption = {
  id: AutonomyLevel;
  label: string;
  summary: string;
  canDo: string[];
  needsApproval: string[];
  neverAutomatic: string[];
};

export type ReputationSignal = {
  label: string;
  value: string;
};

export type ExperienceItem = {
  label: string;
  value: string;
};

export type HumanProfileModel = {
  expertise: string[];
  workingStyle: string[];
  experience: ExperienceItem[];
  learning: LearningItem[];
  reputation: ReputationSignal[];
  knowledgeHref: string;
};

export type RoleProfileContent = {
  expertise: string[];
  workingStyle: string[];
  experienceTemplate: { label: string }[];
  experienceValues: Record<string, string>;
  learning: LearningItem[];
  reputation: ReputationSignal[];
};

export type PeerWorkspaceViewModel = {
  peerId: string;
  header: PeerWorkspaceHeaderModel;
  currentWork: CurrentWorkModel;
  decisionLog: DecisionLogEntry[];
  approvals: ApprovalItem[];
  profile: HumanProfileModel;
  availabilityOptions: AvailabilityOption[];
  autonomyOptions: AutonomyOption[];
};

export type WorkspacePreferences = {
  availability: AvailabilityMode;
  evenings: boolean;
  weekends: boolean;
  autonomy: AutonomyLevel;
  paused: boolean;
};
