import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { buildHourlyHistogram, STATUS_MAP } from "../../../scripts/build-history.ts";
import type { StatusChange, HistogramStatus } from "../../../scripts/build-history.ts";

describe("STATUS_MAP", () => {
  it("maps 'up' to 'operational'", () => {
    expect(STATUS_MAP["up"]).toBe("operational");
  });

  it("maps 'degraded' to 'degraded'", () => {
    expect(STATUS_MAP["degraded"]).toBe("degraded");
  });

  it("maps 'down' to 'down'", () => {
    expect(STATUS_MAP["down"]).toBe("down");
  });
});

describe("buildHourlyHistogram", () => {
  it("fills no-data for empty timelines", () => {
    const result = buildHourlyHistogram({}, new Date("2026-08-01T00:00:00Z"), 24);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("fills no-data before first status change", () => {
    const timelines: Record<string, StatusChange[]> = {
      "API": [
        { timestamp: "2026-08-01T12:00:00Z", status: "operational", message: "OK" },
      ],
    };
    const result = buildHourlyHistogram(timelines, new Date("2026-08-01T00:00:00Z"), 24);
    expect(result["API"]).toHaveLength(24);
    // Hours 0-11 should be no-data (before the change at hour 12)
    for (let i = 0; i < 12; i++) {
      expect(result["API"][i]).toBe("no-data");
    }
    // Hours 12-23 should be operational
    for (let i = 12; i < 24; i++) {
      expect(result["API"][i]).toBe("operational");
    }
  });

  it("carries status forward between changes", () => {
    const timelines: Record<string, StatusChange[]> = {
      "Web": [
        { timestamp: "2026-08-01T00:00:00Z", status: "operational", message: "OK" },
        { timestamp: "2026-08-01T06:00:00Z", status: "down", message: "Outage" },
        { timestamp: "2026-08-01T10:00:00Z", status: "operational", message: "OK" },
      ],
    };
    const result = buildHourlyHistogram(timelines, new Date("2026-08-01T00:00:00Z"), 24);

    // Hours 0-5: operational
    for (let i = 0; i < 6; i++) {
      expect(result["Web"][i]).toBe("operational");
    }
    // Hours 6-9: down
    for (let i = 6; i < 10; i++) {
      expect(result["Web"][i]).toBe("down");
    }
    // Hours 10-23: operational
    for (let i = 10; i < 24; i++) {
      expect(result["Web"][i]).toBe("operational");
    }
  });

  it("handles multiple services independently", () => {
    const timelines: Record<string, StatusChange[]> = {
      "API": [{ timestamp: "2026-08-01T00:00:00Z", status: "operational", message: "OK" }],
      "DB": [{ timestamp: "2026-08-01T00:00:00Z", status: "down", message: "Outage" }],
    };
    const result = buildHourlyHistogram(timelines, new Date("2026-08-01T00:00:00Z"), 24);
    expect(result["API"][0]).toBe("operational");
    expect(result["DB"][0]).toBe("down");
  });

  it("handles degraded status", () => {
    const timelines: Record<string, StatusChange[]> = {
      "Web": [{ timestamp: "2026-08-01T00:00:00Z", status: "degraded", message: "Slow" }],
    };
    const result = buildHourlyHistogram(timelines, new Date("2026-08-01T00:00:00Z"), 24);
    expect(result["Web"][0]).toBe("degraded");
    expect(result["Web"][23]).toBe("degraded");
  });

  it("produces correct number of hours", () => {
    const timelines: Record<string, StatusChange[]> = {
      "Web": [{ timestamp: "2026-05-01T00:00:00Z", status: "operational", message: "OK" }],
    };
    const result = buildHourlyHistogram(timelines, new Date("2026-05-01T00:00:00Z"), 2160);
    expect(result["Web"]).toHaveLength(2160);
  });
});
