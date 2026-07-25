import { describe, expect, it } from "vitest";
import {
  arePathsEqual,
  buildConnectorPathFromRects,
  buildConnectorPaths,
} from "@/lib/hq/connector-paths";

describe("connector-paths", () => {
  it("builds one path per peer with a registered card rect", () => {
    const paths = buildConnectorPaths({
      peerIds: ["p1", "p2"],
      containerRect: { left: 0, top: 0, width: 800, height: 400 },
      managerRect: { left: 350, top: 20, width: 100, height: 60, bottom: 80 },
      cardRects: new Map([
        ["p1", { left: 100, top: 220, width: 160 }],
        ["p2", { left: 540, top: 220, width: 160 }],
      ]),
    });

    expect(paths).toHaveLength(2);
    expect(paths[0]?.peerId).toBe("p1");
    expect(paths[1]?.peerId).toBe("p2");
  });

  it("skips peers without card refs", () => {
    const paths = buildConnectorPaths({
      peerIds: ["p1", "missing"],
      containerRect: { left: 0, top: 0, width: 800, height: 400 },
      managerRect: { left: 350, top: 20, width: 100, height: 60, bottom: 80 },
      cardRects: new Map([["p1", { left: 100, top: 220, width: 160 }]]),
    });

    expect(paths).toHaveLength(1);
    expect(paths[0]?.peerId).toBe("p1");
  });

  it("compares path arrays by peer id and d string", () => {
    const left = [{ peerId: "p1", d: "M 0 0" }];
    const right = [{ peerId: "p1", d: "M 0 0" }];
    const changed = [{ peerId: "p1", d: "M 1 1" }];

    expect(arePathsEqual(left, right)).toBe(true);
    expect(arePathsEqual(left, changed)).toBe(false);
  });

  it("builds a cubic path between manager and card anchors", () => {
    const path = buildConnectorPathFromRects(
      { left: 0, top: 0 },
      { left: 100, top: 10, width: 80, height: 40, bottom: 50 },
      { left: 200, top: 180, width: 120 }
    );

    expect(path.startsWith("M 140 50 C 140")).toBe(true);
    expect(path.endsWith("260 180")).toBe(true);
  });
});
