export type SourceType =
  | "supabase"
  | "website"
  | "document"
  | "integration"
  | "brain"
  | "memory"
  | "derived";

export type SourceFreshness = "live" | "cached" | "stale";

export type SourceRef = {
  id: string;
  type: SourceType;
  label: string;
  fetchedAt: string;
  freshness: SourceFreshness;
};
