import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { parseStatusYaml } from "../../../scripts/yaml-to-json.ts";

describe("parseStatusYaml", () => {
  it("parses a valid status.yaml with multiple services", () => {
    const yaml = `title: "System Status"
url: "status.example.com"
services:
  - name: "Website"
    status: "up"
    message: "All systems operational"
    updated: "2026-08-08T00:00:00Z"
  - name: "API"
    status: "down"
    message: "Investigating outage"
    updated: "2026-08-08T12:00:00Z"
`;
    const result = parseStatusYaml(yaml);

    expect(result.title).toBe("System Status");
    expect(result.url).toBe("status.example.com");
    expect(result.services).toHaveLength(2);
    expect(result.services[0].name).toBe("Website");
    expect(result.services[0].status).toBe("up");
    expect(result.services[0].message).toBe("All systems operational");
    expect(result.services[0].updated).toBe("2026-08-08T00:00:00Z");
    expect(result.services[1].name).toBe("API");
    expect(result.services[1].status).toBe("down");
    expect(result.services[1].message).toBe("Investigating outage");
  });

  it("parses a status.yaml with no services", () => {
    const yaml = `title: "Empty Status"
url: "example.com"
services:
`;
    const result = parseStatusYaml(yaml);

    expect(result.title).toBe("Empty Status");
    expect(result.url).toBe("example.com");
    expect(result.services).toHaveLength(0);
  });

  it("parses a status.yaml with unquoted values", () => {
    const yaml = `title: My Status Page
url: status.example.com
services:
  - name: API
    status: up
    message: Running fine
    updated: 2026-08-08T00:00:00Z
`;
    const result = parseStatusYaml(yaml);

    expect(result.title).toBe("My Status Page");
    expect(result.services[0].name).toBe("API");
    expect(result.services[0].status).toBe("up");
  });

  it("parses a single service", () => {
    const yaml = `title: "Status"
url: ""
services:
  - name: "DB"
    status: "degraded"
    message: "Slow queries"
    updated: "2026-01-01T00:00:00Z"
`;
    const result = parseStatusYaml(yaml);

    expect(result.services).toHaveLength(1);
    expect(result.services[0].name).toBe("DB");
    expect(result.services[0].status).toBe("degraded");
  });

  it("ignores comment lines", () => {
    const yaml = `# This is a comment
title: "Status"
# Another comment
url: "example.com"
services:
  # Service list
  - name: "Web"
    status: "up"
    message: "OK"
    updated: "2026-01-01T00:00:00Z"
`;
    const result = parseStatusYaml(yaml);

    expect(result.title).toBe("Status");
    expect(result.services).toHaveLength(1);
  });

  it("handles empty input", () => {
    const result = parseStatusYaml("");

    expect(result.title).toBe("");
    expect(result.url).toBe("");
    expect(result.services).toHaveLength(0);
  });
});
