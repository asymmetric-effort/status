import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";

describe("App module", () => {
  it("exports App component", async () => {
    const mod = await import("../../../src/components/App.ts");
    expect(typeof mod.App).toBe("function");
  });
});
