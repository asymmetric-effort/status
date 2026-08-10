import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { extendHistogram } from "../../src/extendHistogram.ts";

describe("extendHistogram edge cases", () => {
  const totalHours = 90 * 24;

  it("handles generated time in the future", () => {
    const hours = new Array(totalHours).fill("operational");
    const futureTime = new Date(Date.now() + 3600000).toISOString();
    const start = new Date(Date.now() - totalHours * 3600000).toISOString();

    const result = extendHistogram(hours, start, futureTime, "up");
    expect(result.hours).toEqual(hours);
  });

  it("extends with degraded status", () => {
    const hours = new Array(totalHours).fill("operational");
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    const start = new Date(Date.now() - (totalHours + 2) * 3600000).toISOString();

    const result = extendHistogram(hours, start, twoHoursAgo, "degraded");
    expect(result.hours[totalHours - 1]).toBe("degraded");
    expect(result.hours[totalHours - 2]).toBe("degraded");
  });

  it("handles unknown status by defaulting to operational", () => {
    const hours = new Array(totalHours).fill("no-data");
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const start = new Date(Date.now() - (totalHours + 1) * 3600000).toISOString();

    const result = extendHistogram(hours, start, oneHourAgo, "unknown-status");
    expect(result.hours[totalHours - 1]).toBe("operational");
  });

  it("maintains correct total length after large extension", () => {
    const hours = new Array(totalHours).fill("operational");
    const tenHoursAgo = new Date(Date.now() - 10 * 3600000).toISOString();
    const start = new Date(Date.now() - (totalHours + 10) * 3600000).toISOString();

    const result = extendHistogram(hours, start, tenHoursAgo, "down");
    expect(result.hours).toHaveLength(totalHours);
    // Last 10 should be down
    for (let i = totalHours - 10; i < totalHours; i++) {
      expect(result.hours[i]).toBe("down");
    }
  });
});
