import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { parseCoverage } from "../../../scripts/check-coverage.ts";

describe("parseCoverage", () => {
  it("parses Node test runner coverage format", () => {
    const output = `ℹ all files         |  78.23 |    95.59 |   76.47 |`;
    expect(parseCoverage(output)).toBe(78.23);
  });

  it("parses alternative hash format", () => {
    const output = `# all files         |  99.50 |   100.00 |   98.00 |`;
    expect(parseCoverage(output)).toBe(99.50);
  });

  it("returns null for unparseable output", () => {
    expect(parseCoverage("no coverage here")).toBeNull();
  });

  it("parses 100% coverage", () => {
    const output = `ℹ all files         | 100.00 |   100.00 |  100.00 |`;
    expect(parseCoverage(output)).toBe(100);
  });
});
