import { describe, it, expect, fn } from "@asymmetric-effort/nogginlessdom";
import { parseArgs } from "../../../scripts/yaml-update.ts";

describe("parseArgs", () => {
  // parseArgs calls process.exit on invalid input, so we can only test valid cases
  it("parses valid args", () => {
    const result = parseArgs(["--service", "API", "--status", "up", "--message", "OK"]);
    expect(result.service).toBe("API");
    expect(result.status).toBe("up");
    expect(result.message).toBe("OK");
  });

  it("parses args in any order", () => {
    const result = parseArgs(["--status", "down", "--message", "Outage", "--service", "Web"]);
    expect(result.service).toBe("Web");
    expect(result.status).toBe("down");
    expect(result.message).toBe("Outage");
  });

  it("parses degraded status", () => {
    const result = parseArgs(["--service", "DB", "--status", "degraded", "--message", "Slow"]);
    expect(result.status).toBe("degraded");
  });

  it("handles messages with spaces", () => {
    const result = parseArgs(["--service", "API", "--status", "up", "--message", "All systems operational"]);
    expect(result.message).toBe("All systems operational");
  });
});
