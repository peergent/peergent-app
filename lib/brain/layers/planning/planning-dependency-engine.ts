import type { PlanningDependency, PlanningNode } from "./types";

export type DependencyAnalysisInput = {
  nodes: readonly PlanningNode[];
  dependencies: readonly PlanningDependency[];
};

export type DependencyAnalysisResult = {
  dependencies: readonly PlanningDependency[];
  criticalPath: readonly string[];
  parallelOpportunities: readonly { nodeIds: readonly string[]; reason: string }[];
  missingDependencies: readonly { nodeId: string; missingId: string; reason: string }[];
  circularDependencies: readonly { cycle: readonly string[] }[];
  unnecessaryDependencies: readonly { dependencyId: string; reason: string }[];
};

function nodeMap(nodes: readonly PlanningNode[]): Map<string, PlanningNode> {
  return new Map(nodes.map((n) => [n.id, n]));
}

function detectCycle(
  startId: string,
  adjacency: Map<string, string[]>,
  visited: Set<string>,
  stack: Set<string>,
  path: string[]
): string[] | null {
  visited.add(startId);
  stack.add(startId);
  path.push(startId);

  for (const next of adjacency.get(startId) ?? []) {
    if (!visited.has(next)) {
      const cycle = detectCycle(next, adjacency, visited, stack, path);
      if (cycle) return cycle;
    } else if (stack.has(next)) {
      const idx = path.indexOf(next);
      return path.slice(idx);
    }
  }

  stack.delete(startId);
  path.pop();
  return null;
}

/** Analyze dependency graph — detect cycles, gaps, parallel opportunities, critical path. */
export function analyzePlanningDependencies(input: DependencyAnalysisInput): DependencyAnalysisResult {
  const ids = new Set(input.nodes.map((n) => n.id));
  const nodes = nodeMap(input.nodes);

  const missingDependencies: { nodeId: string; missingId: string; reason: string }[] = [];
  for (const node of input.nodes) {
    for (const depId of node.dependsOn) {
      if (!ids.has(depId)) {
        missingDependencies.push({
          nodeId: node.id,
          missingId: depId,
          reason: `Node "${node.title}" depends on missing node "${depId}".`,
        });
      }
    }
  }

  const adjacency = new Map<string, string[]>();
  for (const node of input.nodes) {
    adjacency.set(node.id, [...node.dependsOn]);
  }

  const circularDependencies: { cycle: readonly string[] }[] = [];
  const visited = new Set<string>();
  for (const node of input.nodes) {
    if (!visited.has(node.id)) {
      const cycle = detectCycle(node.id, adjacency, new Set(), new Set(), []);
      if (cycle && cycle.length > 0) {
        circularDependencies.push({ cycle });
      }
      node.id.split("").forEach(() => visited.add(node.id));
    }
  }

  const unnecessaryDependencies: { dependencyId: string; reason: string }[] = [];
  for (const dep of input.dependencies) {
    const from = nodes.get(dep.fromNodeId);
    const to = nodes.get(dep.toNodeId);
    if (from && to && from.priority === "low" && to.priority === "critical") {
      unnecessaryDependencies.push({
        dependencyId: dep.id,
        reason: `Low-priority "${from.title}" should not block critical "${to.title}" unless evidence requires it.`,
      });
    }
  }

  const parallelOpportunities: { nodeIds: readonly string[]; reason: string }[] = [];
  const byStage = new Map<string, PlanningNode[]>();
  for (const node of input.nodes) {
    if (node.dependsOn.length === 0) {
      const key = node.ownerBrain;
      const list = byStage.get(key) ?? [];
      list.push(node);
      byStage.set(key, list);
    }
  }
  for (const [, group] of byStage) {
    if (group.length >= 2) {
      parallelOpportunities.push({
        nodeIds: group.map((n) => n.id),
        reason: "No mutual dependencies — can run in parallel to reduce time-to-value.",
      });
    }
  }

  const criticalPath = computeCriticalPath(input.nodes);

  return {
    dependencies: input.dependencies,
    criticalPath,
    parallelOpportunities,
    missingDependencies,
    circularDependencies,
    unnecessaryDependencies,
  };
}

function computeCriticalPath(nodes: readonly PlanningNode[]): string[] {
  const memo = new Map<string, number>();
  const pathMemo = new Map<string, string[]>();

  function longestFrom(id: string, visiting: Set<string>): { length: number; path: string[] } {
    if (memo.has(id)) {
      return { length: memo.get(id)!, path: pathMemo.get(id)! };
    }
    if (visiting.has(id)) return { length: 0, path: [id] };

    visiting.add(id);
    const node = nodes.find((n) => n.id === id);
    if (!node || node.dependsOn.length === 0) {
      memo.set(id, 1);
      pathMemo.set(id, [id]);
      visiting.delete(id);
      return { length: 1, path: [id] };
    }

    let best = { length: 0, path: [] as string[] };
    for (const dep of node.dependsOn) {
      const result = longestFrom(dep, visiting);
      if (result.length >= best.length) {
        best = result;
      }
    }
    const length = best.length + 1;
    const path = [...best.path, id];
    memo.set(id, length);
    pathMemo.set(id, path);
    visiting.delete(id);
    return { length, path };
  }

  let longest: string[] = [];
  for (const node of nodes) {
    const { path } = longestFrom(node.id, new Set());
    if (path.length > longest.length) longest = path;
  }
  return longest;
}

export function mergeNodeDependencies(nodes: readonly PlanningNode[]): PlanningDependency[] {
  const deps: PlanningDependency[] = [];
  for (const node of nodes) {
    for (const depId of node.dependsOn) {
      deps.push({
        id: `dep:${depId}->${node.id}`,
        fromNodeId: depId,
        toNodeId: node.id,
        relationship: "requires",
        reason: `${node.title} requires ${depId} to complete first.`,
      });
    }
  }
  return deps;
}
