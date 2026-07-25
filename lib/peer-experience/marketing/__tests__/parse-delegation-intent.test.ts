import { describe, expect, it } from "vitest";
import {
  buildClarifyingQuestions,
  finalizeDelegationTask,
  parseDelegationIntent,
} from "@/lib/peer-experience/marketing/parse-delegation-intent";

describe("parseDelegationIntent", () => {
  it("parses instagram visual request", () => {
    const intent = parseDelegationIntent(
      "Create an Instagram post with an image promoting Peergent."
    );

    expect(intent.channel).toBe("instagram");
    expect(intent.needsVisual).toBe(true);
    expect(intent.topic.toLowerCase()).toContain("peergent");
  });

  it("asks objective when missing", () => {
    const intent = parseDelegationIntent(
      "Create an Instagram post with an image promoting Peergent."
    );
    const questions = buildClarifyingQuestions(intent);

    expect(questions.some((q) => q.id === "objective")).toBe(true);
  });

  it("builds task hint for generation API", () => {
    const intent = parseDelegationIntent(
      "Create an Instagram post with an image promoting Peergent."
    );
    const task = finalizeDelegationTask(intent, { objective: "Lead generation" }, "once");

    expect(task.taskHint).toContain("Instagram");
    expect(task.objectiveLabel.toLowerCase()).toContain("lead generation");
  });
});
