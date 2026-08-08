import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { updateServiceInYaml } from "../../../scripts/yaml-update.ts";

describe("updateServiceInYaml", () => {
  const baseYaml = `title: "System Status"
url: "status.example.com"
services:
  - name: "Website"
    status: "up"
    message: "All systems operational"
    updated: "2026-08-08T00:00:00Z"
  - name: "API"
    status: "up"
    message: "All systems operational"
    updated: "2026-08-08T00:00:00Z"
`;

  it("updates an existing service status", () => {
    const result = updateServiceInYaml(baseYaml, "API", "down", "Outage detected");

    expect(result).toContain('status: "down"');
    expect(result).toContain('message: "Outage detected"');
    // Website should be unchanged
    expect(result).toContain('- name: "Website"');
  });

  it("updates the first service", () => {
    const result = updateServiceInYaml(baseYaml, "Website", "degraded", "Slow response");

    expect(result).toContain('status: "degraded"');
    expect(result).toContain('message: "Slow response"');
  });

  it("sets the updated timestamp to current time", () => {
    const before = new Date().toISOString().substring(0, 10);
    const result = updateServiceInYaml(baseYaml, "API", "down", "Test");
    const after = new Date().toISOString().substring(0, 10);

    // The updated field should contain today's date
    const match = result.match(/updated: "(\d{4}-\d{2}-\d{2})/);
    expect(match).not.toBeNull();
    // At least the last updated field should be today
    expect(result).toContain(`updated: "${before}`) ;
  });

  it("appends a new service if not found", () => {
    const result = updateServiceInYaml(baseYaml, "Database", "up", "Running");

    expect(result).toContain('name: "Database"');
    expect(result).toContain('status: "up"');
    expect(result).toContain('message: "Running"');
  });

  it("preserves YAML structure for unchanged services", () => {
    const result = updateServiceInYaml(baseYaml, "API", "down", "Outage");

    // Website entry should be completely untouched
    expect(result).toContain('  - name: "Website"');
    expect(result).toContain('    status: "up"');
    expect(result).toContain('    message: "All systems operational"');
    expect(result).toContain('    updated: "2026-08-08T00:00:00Z"');
  });

  it("preserves the title and url", () => {
    const result = updateServiceInYaml(baseYaml, "API", "down", "Test");

    expect(result).toContain('title: "System Status"');
    expect(result).toContain('url: "status.example.com"');
  });
});
