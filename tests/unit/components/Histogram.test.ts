import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { getDayStatus, STATUS_LABELS } from "../../../src/components/Histogram.ts";
import { renderToString } from "@asymmetric-effort/specifyjs/server";
import { createElement } from "@asymmetric-effort/specifyjs";
import { Histogram } from "../../../src/components/Histogram.ts";
import type { HistogramStatus } from "../../../src/hooks/useHistory.ts";

describe("getDayStatus", () => {
  it("returns 'down' if any hour is down", () => {
    expect(getDayStatus(["operational", "down", "operational"])).toBe("down");
  });

  it("returns 'degraded' if any hour is degraded and none down", () => {
    expect(getDayStatus(["operational", "degraded", "operational"])).toBe("degraded");
  });

  it("returns 'operational' if all hours are operational", () => {
    expect(getDayStatus(["operational", "operational"])).toBe("operational");
  });

  it("returns 'no-data' if all hours are no-data", () => {
    expect(getDayStatus(["no-data", "no-data"])).toBe("no-data");
  });

  it("prioritizes down over degraded", () => {
    expect(getDayStatus(["degraded", "down"])).toBe("down");
  });
});

describe("STATUS_LABELS", () => {
  it("has labels for all statuses", () => {
    expect(STATUS_LABELS["operational"]).toBe("Operational");
    expect(STATUS_LABELS["degraded"]).toBe("Degraded");
    expect(STATUS_LABELS["down"]).toBe("Down");
    expect(STATUS_LABELS["no-data"]).toBe("No Data");
  });
});

describe("Histogram legend swatches", () => {
  it("renders legend swatches with pattern classes", () => {
    const mockHours: HistogramStatus[] = new Array(2160).fill("operational");
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
    }));
    expect(html).toContain("histogram-legend-swatch histogram-operational");
    expect(html).toContain("histogram-legend-swatch histogram-degraded");
    expect(html).toContain("histogram-legend-swatch histogram-down");
    expect(html).toContain("histogram-legend-swatch histogram-no-data");
  });
});

describe("Histogram component", () => {
  const mockHours: HistogramStatus[] = new Array(2160).fill("operational");

  it("renders the service name", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "API",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
    }));
    expect(html).toContain("API");
  });

  it("renders uptime percentage", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
    }));
    expect(html).toContain("100.00%");
    expect(html).toContain("uptime");
  });

  it("renders 90 histogram bars", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
    }));
    const barCount = (html.match(/histogram-bar/g) || []).length;
    expect(barCount).toBe(90);
  });

  it("renders legend items", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
    }));
    expect(html).toContain("Operational");
    expect(html).toContain("Degraded");
    expect(html).toContain("Down");
    expect(html).toContain("No Data");
  });

  it("renders a close button", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
    }));
    expect(html).toContain("histogram-close");
  });
});
