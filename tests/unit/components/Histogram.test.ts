import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { getDayStatus, STATUS_LABELS, formatHour } from "../../../src/components/Histogram.ts";
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

describe("formatHour", () => {
  it("formats a date to month day and time", () => {
    const result = formatHour(new Date("2026-08-09T14:00:00Z"));
    expect(result).toContain("Aug");
    expect(result).toContain("9");
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
      messages: [],
      currentStatus: "up",
      currentMessage: "All systems operational",
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
      messages: [],
      currentStatus: "up",
      currentMessage: "All systems operational",
    }));
    expect(html).toContain("API");
  });

  it("renders uptime percentage", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
      messages: [],
      currentStatus: "up",
      currentMessage: "All systems operational",
    }));
    expect(html).toContain("100.00%");
    expect(html).toContain("uptime");
  });

  it("renders 2160 hourly histogram bars", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
      messages: [],
      currentStatus: "up",
      currentMessage: "All systems operational",
    }));
    const barCount = (html.match(/histogram-bar/g) || []).length;
    expect(barCount).toBe(2160);
  });

  it("renders a scrollable chart container", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
      messages: [],
      currentStatus: "up",
      currentMessage: "All systems operational",
    }));
    expect(html).toContain("histogram-chart-container");
  });

  it("renders date markers", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
      messages: [],
      currentStatus: "up",
      currentMessage: "All systems operational",
    }));
    expect(html).toContain("histogram-date-label");
    expect(html).toContain("histogram-date-markers");
  });

  it("renders legend items", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
      messages: [],
      currentStatus: "up",
      currentMessage: "All systems operational",
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
      messages: [],
      currentStatus: "up",
      currentMessage: "All systems operational",
    }));
    expect(html).toContain("histogram-close");
  });

  it("renders Messages heading", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
      messages: [],
      currentStatus: "up",
      currentMessage: "OK",
    }));
    expect(html).toContain("Messages");
  });

  it("renders 'No incident history' when messages is empty", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "Web",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
      messages: [],
      currentStatus: "up",
      currentMessage: "OK",
    }));
    expect(html).toContain("No incident history");
  });

  it("renders message entries with timestamps and status", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "TARDIS",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
      messages: [
        { timestamp: "2026-08-09T16:45:00Z", status: "degraded", message: "Temporal circuits slow" },
        { timestamp: "2026-08-09T12:00:00Z", status: "operational", message: "All systems operational" },
      ],
      currentStatus: "degraded",
      currentMessage: "Temporal circuits slow",
    }));
    expect(html).toContain("Temporal circuits slow");
    expect(html).toContain("All systems operational");
    expect(html).toContain("Degraded");
    expect(html).toContain("Operational");
    expect(html).toContain("histogram-message-time");
    expect(html).toContain("histogram-message-degraded");
    expect(html).toContain("histogram-message-operational");
  });

  it("renders message entries with color-coded borders", () => {
    const html = renderToString(createElement(Histogram as any, {
      serviceName: "WOPR",
      hours: mockHours,
      startTime: "2026-05-11T00:00:00Z",
      onClose: () => {},
      messages: [
        { timestamp: "2026-08-09T15:00:00Z", status: "down", message: "System offline" },
      ],
      currentStatus: "down",
      currentMessage: "System offline",
    }));
    expect(html).toContain("histogram-message-down");
    expect(html).toContain("System offline");
  });
});
