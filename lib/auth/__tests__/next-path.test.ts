import { describe, expect, it } from "vitest";
import { getSafeNextPath } from "@/lib/auth/next-path";

describe("getSafeNextPath", () => {
  it("returns null for unsafe targets", () => {
    expect(getSafeNextPath(null)).toBeNull();
    expect(getSafeNextPath("https://evil.test")).toBeNull();
    expect(getSafeNextPath("//evil.test")).toBeNull();
    expect(getSafeNextPath("/login")).toBeNull();
    expect(getSafeNextPath("/auth/post-login")).toBeNull();
  });

  it("allows valid internal destinations", () => {
    expect(getSafeNextPath("/home")).toBe("/home");
    expect(getSafeNextPath("/office/demo/work")).toBe("/office/demo/work");
    expect(getSafeNextPath("/office/demo/work?workspace=camp-1")).toBe(
      "/office/demo/work?workspace=camp-1"
    );
  });
});
