import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { renderToString } from "@asymmetric-effort/specifyjs/server";
import { createElement } from "@asymmetric-effort/specifyjs";
import { ServiceCard, formatRelativeTime } from "../../../src/components/ServiceCard.ts";
import type { Service } from "../../../src/types.ts";

describe("formatRelativeTime", () => {
  it("returns 'Just now' for very recent timestamps", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("Just now");
  });

  it("returns minutes ago for recent timestamps", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago for older timestamps", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago for old timestamps", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });

  it("returns 'Unknown' for invalid timestamps", () => {
    expect(formatRelativeTime("not-a-date")).toBe("Unknown");
  });
});

describe("ServiceCard", () => {
  it("renders the service name", () => {
    const service: Service = {
      name: "API Gateway",
      status: "up",
      message: "Running smoothly",
      updated: new Date().toISOString(),
    };
    const html = renderToString(createElement(ServiceCard as any, { service }));
    expect(html).toContain("API Gateway");
  });

  it("renders the service message", () => {
    const service: Service = {
      name: "Web",
      status: "degraded",
      message: "High latency detected",
      updated: new Date().toISOString(),
    };
    const html = renderToString(createElement(ServiceCard as any, { service }));
    expect(html).toContain("High latency detected");
  });

  it("applies the correct status class", () => {
    const service: Service = {
      name: "DB",
      status: "down",
      message: "Connection failed",
      updated: new Date().toISOString(),
    };
    const html = renderToString(createElement(ServiceCard as any, { service }));
    expect(html).toContain("service-card-down");
  });

  it("renders for each status type", () => {
    for (const status of ["up", "down", "degraded"] as const) {
      const service: Service = {
        name: "Test",
        status,
        message: "Test message",
        updated: new Date().toISOString(),
      };
      const html = renderToString(createElement(ServiceCard as any, { service }));
      expect(html).toContain(`service-card-${status}`);
    }
  });
});
