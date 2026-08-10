import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { lintStatusYaml } from "../../../scripts/lint-status.ts";

describe("lintStatusYaml edge cases", () => {
  it("accepts multiple valid services", () => {
    const yaml = `title: "Status"
url: "example.com"
services:
  - name: "Web"
    status: "up"
    message: "OK"
    updated: "2026-08-08T00:00:00Z"
  - name: "API"
    status: "down"
    message: "Outage"
    updated: "2026-08-08T01:00:00Z"
  - name: "DB"
    status: "degraded"
    message: "Slow"
    updated: "2026-08-08T02:00:00Z"
`;
    const errors = lintStatusYaml(yaml);
    expect(errors).toHaveLength(0);
  });

  it("accepts empty url field", () => {
    const yaml = `title: "Status"
services:
`;
    const errors = lintStatusYaml(yaml);
    // url defaults to "" which is a valid string
    expect(errors.some((e) => e.message.includes("url"))).toBe(false);
  });

  it("returns error for empty title", () => {
    const yaml = `title: ""
url: "example.com"
services:
`;
    const errors = lintStatusYaml(yaml);
    expect(errors.some((e) => e.message.includes("title"))).toBe(true);
  });

  it("returns multiple errors for multiple issues", () => {
    const yaml = `title: "Status"
url: "example.com"
services:
  - name: "API"
    status: "broken"
    message: ""
    updated: "not-a-date"
`;
    const errors = lintStatusYaml(yaml);
    expect(errors.length).toBeGreaterThan(1);
  });
});
