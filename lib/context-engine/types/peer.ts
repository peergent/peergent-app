export type PeerRole =
  | "Sales"
  | "Marketing"
  | "Support"
  | "Planning"
  | "Finance"
  | "Custom";

export type PeerScope = {
  peerId: string;
  role: PeerRole;
  name: string;
  objective: string;
  website: string;
  status: string;
};

export type PeerIdentitySlice = {
  name: string;
  role: PeerRole;
  roleFocus?: string;
  workingStyle?: string[];
};
