import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { extendHistogram } from "../../src/extendHistogram.ts";

describe("extendHistogram", () => {
  const totalHours = 90 * 24; // 2160

  it("returns original data when generated time is current", () => {
    const hours = new Array(totalHours).fill("operational");
    const now = new Date().toISOString();
    const start = new Date(Date.now() - totalHours * 3600000).toISOString();

    const result = extendHistogram(hours, start, now, "up");
    expect(result.hours).toHaveLength(totalHours);
    expect(result.hours).toEqual(hours);
  });

  it("extends with current status when time has passed", () => {
    const hours = new Array(totalHours).fill("operational");
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    const start = new Date(Date.now() - (totalHours + 3) * 3600000).toISOString();

    const result = extendHistogram(hours, start, threeHoursAgo, "degraded");
    expect(result.hours).toHaveLength(totalHours);
    // Last 3 hours should be degraded
    expect(result.hours[totalHours - 1]).toBe("degraded");
    expect(result.hours[totalHours - 2]).toBe("degraded");
    expect(result.hours[totalHours - 3]).toBe("degraded");
    // Hour before that should still be operational
    expect(result.hours[totalHours - 4]).toBe("operational");
  });

  it("maps 'up' status to 'operational'", () => {
    const hours = new Array(totalHours).fill("no-data");
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const start = new Date(Date.now() - (totalHours + 1) * 3600000).toISOString();

    const result = extendHistogram(hours, start, oneHourAgo, "up");
    expect(result.hours[totalHours - 1]).toBe("operational");
  });

  it("maps 'down' status correctly", () => {
    const hours = new Array(totalHours).fill("operational");
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    const start = new Date(Date.now() - (totalHours + 2) * 3600000).toISOString();

    const result = extendHistogram(hours, start, twoHoursAgo, "down");
    expect(result.hours[totalHours - 1]).toBe("down");
    expect(result.hours[totalHours - 2]).toBe("down");
  });

  it("slides the window forward, dropping oldest hours", () => {
    const hours = new Array(totalHours).fill("no-data");
    hours[0] = "operational"; // oldest hour has data
    const fiveHoursAgo = new Date(Date.now() - 5 * 3600000).toISOString();
    const start = new Date(Date.now() - (totalHours + 5) * 3600000).toISOString();

    const result = extendHistogram(hours, start, fiveHoursAgo, "up");
    expect(result.hours).toHaveLength(totalHours);
    // The oldest 5 hours should have been dropped
    // First entry should now be what was at index 5
    expect(result.hours[0]).toBe("no-data");
  });

  it("does nothing when less than an hour has passed", () => {
    const hours = new Array(totalHours).fill("operational");
    const thirtyMinAgo = new Date(Date.now() - 30 * 60000).toISOString();
    const start = new Date(Date.now() - totalHours * 3600000).toISOString();

    const result = extendHistogram(hours, start, thirtyMinAgo, "up");
    expect(result.hours).toEqual(hours);
  });
});
