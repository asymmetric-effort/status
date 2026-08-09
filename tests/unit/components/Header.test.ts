import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { renderToString } from "@asymmetric-effort/specifyjs/server";
import { createElement } from "@asymmetric-effort/specifyjs";
import { Header, getOverallStatus } from "../../../src/components/Header.ts";
import type { Service } from "../../../src/types.ts";

describe("getOverallStatus", () => {
  it("returns 'All Systems Operational' when all services are up", () => {
    const services: Service[] = [
      { name: "Web", status: "up", message: "OK", updated: "2026-01-01T00:00:00Z" },
      { name: "API", status: "up", message: "OK", updated: "2026-01-01T00:00:00Z" },
    ];
    const result = getOverallStatus(services);
    expect(result.label).toBe("All Systems Operational");
    expect(result.className).toBe("overall-up");
  });

  it("returns 'Partial Outage' when any service is degraded", () => {
    const services: Service[] = [
      { name: "Web", status: "up", message: "OK", updated: "2026-01-01T00:00:00Z" },
      { name: "API", status: "degraded", message: "Slow", updated: "2026-01-01T00:00:00Z" },
    ];
    const result = getOverallStatus(services);
    expect(result.label).toBe("Partial Outage");
    expect(result.className).toBe("overall-degraded");
  });

  it("returns 'Major Outage' when any service is down", () => {
    const services: Service[] = [
      { name: "Web", status: "up", message: "OK", updated: "2026-01-01T00:00:00Z" },
      { name: "API", status: "down", message: "Outage", updated: "2026-01-01T00:00:00Z" },
    ];
    const result = getOverallStatus(services);
    expect(result.label).toBe("Major Outage");
    expect(result.className).toBe("overall-down");
  });

  it("prioritizes down over degraded", () => {
    const services: Service[] = [
      { name: "Web", status: "degraded", message: "Slow", updated: "2026-01-01T00:00:00Z" },
      { name: "API", status: "down", message: "Outage", updated: "2026-01-01T00:00:00Z" },
    ];
    const result = getOverallStatus(services);
    expect(result.label).toBe("Major Outage");
  });

  it("returns 'No Services Configured' for empty array", () => {
    const result = getOverallStatus([]);
    expect(result.label).toBe("No Services Configured");
    expect(result.className).toBe("overall-none");
  });
});

describe("Header", () => {
  it("renders the title", () => {
    const services: Service[] = [
      { name: "Web", status: "up", message: "OK", updated: "2026-01-01T00:00:00Z" },
    ];
    const html = renderToString(createElement(Header as any, { title: "Balefire Status", services }));
    expect(html).toContain("Balefire Status");
  });

  it("renders a header element with banner class", () => {
    const html = renderToString(createElement(Header as any, { title: "Test", services: [] }));
    expect(html).toContain("<header");
    expect(html).toContain("banner");
  });

  it("renders the fire-on-mountain SVG icon", () => {
    const html = renderToString(createElement(Header as any, { title: "Test", services: [] }));
    expect(html).toContain("<svg");
    expect(html).toContain("banner-icon");
  });

  it("shows overall status text", () => {
    const services: Service[] = [
      { name: "Web", status: "up", message: "OK", updated: "2026-01-01T00:00:00Z" },
    ];
    const html = renderToString(createElement(Header as any, { title: "Status", services }));
    expect(html).toContain("All Systems Operational");
  });

  it("shows No Services Configured for empty services", () => {
    const html = renderToString(createElement(Header as any, { title: "Status", services: [] }));
    expect(html).toContain("No Services Configured");
  });
});
