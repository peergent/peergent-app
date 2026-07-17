export type ToolCapability = {
  name: string;
  description: string;
  enabled: boolean;
};

export type MemoryCapability = {
  enabled: boolean;
  maxItems: number;
};

export type BrainCapability = {
  enabled: boolean;
  assessmentAvailable: boolean;
};

export type ContextCapabilities = {
  tools: ToolCapability[];
  memory: MemoryCapability;
  brain: BrainCapability;
};
