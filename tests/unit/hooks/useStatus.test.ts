import { describe, it, expect, fn } from "@asymmetric-effort/nogginlessdom";

describe("useStatus", () => {
  it("is exported from the module", async () => {
    const mod = await import("../../../src/hooks/useStatus.ts");
    expect(typeof mod.useStatus).toBe("function");
  });
});
