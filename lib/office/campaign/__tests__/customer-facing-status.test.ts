import { describe, expect, it } from "vitest";
import {
  customerLabelForProjectStatus,
  mapProjectStatusToCustomerState,
} from "@/lib/office/campaign/customer-facing-status";

describe("customer-facing campaign states", () => {
  it("maps waiting_for_review to approval state in NL", () => {
    expect(
      customerLabelForProjectStatus("waiting_for_review", "nl", { hasPendingReview: true })
    ).toBe("Wacht op jouw goedkeuring");
  });

  it("maps monitoring to results tracking", () => {
    expect(mapProjectStatusToCustomerState("monitoring_results")).toBe("tracking_results");
    expect(customerLabelForProjectStatus("monitoring_results", "nl")).toBe(
      "Resultaten worden gevolgd"
    );
  });

  it("maps preparing to in production", () => {
    expect(customerLabelForProjectStatus("preparing", "nl")).toBe("In productie");
  });
});
