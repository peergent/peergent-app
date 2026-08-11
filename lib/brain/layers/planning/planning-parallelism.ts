import type { ParallelGroups, WorkPackage } from "./brain-types";

export function identifyParallelism(input: {
  workPackages: readonly WorkPackage[];
  strategyApprovedGateId: string;
}): ParallelGroups {
  const briefPackages = input.workPackages.filter((w) => w.title.includes("creative brief"));
  const independent = briefPackages.length > 1 ? briefPackages.map((w) => w.id) : [];

  const sequential = input.workPackages
    .filter((w) => w.title.includes("execution handoff") || w.title.includes("approval package"))
    .map((w) => w.id);

  return {
    parallelGroups:
      independent.length > 1
        ? [
            {
              id: "parallel-creative-briefs",
              workPackageIds: independent,
              reason: "Channel creative briefs can begin in parallel after strategy approval",
            },
          ]
        : [],
    sequentialGroups:
      sequential.length > 0
        ? [
            {
              id: "sequential-approval-execution",
              workPackageIds: sequential,
              reason: "Validation requires completed creative; execution requires validation",
            },
          ]
        : [],
  };
}
