import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { lintStatusYaml } from "../../../scripts/lint-status.ts";

describe("lintStatusYaml", () => {
  it("returns no errors for valid status.yaml", () => {
    const yaml = `title: "System Status"
url: "status.example.com"
services:
  - name: "API"
    status: "up"
    message: "All systems operational"
    updated: "2026-08-08T00:00:00Z"
`;
    const errors = lintStatusYaml(yaml);
    expect(errors).toHaveLength(0);
  });

  it("returns no errors for valid yaml with no services", () => {
    const yaml = `title: "Status"
url: "example.com"
services:
`;
    const errors = lintStatusYaml(yaml);
    expect(errors).toHaveLength(0);
  });

  it("returns error for empty file", () => {
    const errors = lintStatusYaml("");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("empty");
  });

  it("returns error for missing title", () => {
    const yaml = `url: "example.com"
services:
`;
    const errors = lintStatusYaml(yaml);
    expect(errors.some((e) => e.message.includes("title"))).toBe(true);
  });

  it("returns error for invalid status value", () => {
    const yaml = `title: "Status"
url: "example.com"
services:
  - name: "API"
    status: "broken"
    message: "Something"
    updated: "2026-08-08T00:00:00Z"
`;
    const errors = lintStatusYaml(yaml);
    expect(errors.some((e) => e.message.includes("invalid status"))).toBe(true);
  });

  it("returns error for duplicate service names", () => {
    const yaml = `title: "Status"
url: "example.com"
services:
  - name: "API"
    status: "up"
    message: "OK"
    updated: "2026-08-08T00:00:00Z"
  - name: "API"
    status: "down"
    message: "Fail"
    updated: "2026-08-08T00:00:00Z"
`;
    const errors = lintStatusYaml(yaml);
    expect(errors.some((e) => e.message.includes("duplicate"))).toBe(true);
  });

  it("returns error for missing service name", () => {
    const yaml = `title: "Status"
url: "example.com"
services:
  - name: "  "
    status: "up"
    message: "OK"
    updated: "2026-08-08T00:00:00Z"
`;
    const errors = lintStatusYaml(yaml);
    expect(errors.some((e) => e.message.includes("name"))).toBe(true);
  });

  it("returns error for invalid timestamp", () => {
    const yaml = `title: "Status"
url: "example.com"
services:
  - name: "API"
    status: "up"
    message: "OK"
    updated: "not-a-date"
`;
    const errors = lintStatusYaml(yaml);
    expect(errors.some((e) => e.message.includes("timestamp"))).toBe(true);
  });

  it("returns error for missing message", () => {
    const yaml = `title: "Status"
url: "example.com"
services:
  - name: "API"
    status: "up"
    message: ""
    updated: "2026-08-08T00:00:00Z"
`;
    const errors = lintStatusYaml(yaml);
    expect(errors.some((e) => e.message.includes("message"))).toBe(true);
  });

  it("validates all three valid statuses", () => {
    for (const status of ["up", "down", "degraded"]) {
      const yaml = `title: "Status"
url: "example.com"
services:
  - name: "Svc"
    status: "${status}"
    message: "OK"
    updated: "2026-08-08T00:00:00Z"
`;
      const errors = lintStatusYaml(yaml);
      expect(errors).toHaveLength(0);
    }
  });
});
