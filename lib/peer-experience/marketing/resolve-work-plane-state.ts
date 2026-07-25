import type { DeliverableViewModel } from "../types";

export type WorkPlaneState =
  | "empty"
  | "working"
  | "document"
  | "review"
  | "publication"
  | "completion";

export function resolveWorkPlaneState(deliverable: DeliverableViewModel): WorkPlaneState {
  switch (deliverable.kind) {
    case "empty":
      return deliverable.working ? "working" : "empty";
    case "document":
      return "document";
    case "content":
      return deliverable.reviewable ? "review" : "document";
    case "publish-preview":
      return "publication";
    case "complete":
      return "completion";
  }
}
