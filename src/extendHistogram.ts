type HistogramStatus = "operational" | "degraded" | "down" | "no-data";

const STATUS_MAP: Record<string, HistogramStatus> = {
  up: "operational",
  degraded: "degraded",
  down: "down",
};

interface ExtendedHistogram {
  hours: HistogramStatus[];
  startTime: string;
}

/**
 * Extends a build-time histogram to cover the current browser time.
 *
 * The histogram from history.json covers startTime to generated time.
 * If the browser's current time is past the generated time, this fills
 * the gap with the service's current status (assuming no change since
 * the last update) and slides the 90-day window forward.
 */
export function extendHistogram(
  hours: HistogramStatus[],
  startTime: string,
  generated: string,
  currentStatus: string,
): ExtendedHistogram {
  const totalHours = 90 * 24;
  const now = Date.now();
  const generatedMs = new Date(generated).getTime();
  const startMs = new Date(startTime).getTime();

  // How many hours have passed since the data was generated
  const elapsedMs = now - generatedMs;
  if (elapsedMs <= 0) {
    // Data is from the future or current — no extension needed
    return { hours, startTime };
  }

  const extraHours = Math.floor(elapsedMs / 3600000);
  if (extraHours === 0) {
    return { hours, startTime };
  }

  // The current status mapped to histogram status
  const fillStatus = STATUS_MAP[currentStatus] || "operational";

  // Append extra hours with the current status
  const extended = [...hours, ...new Array(extraHours).fill(fillStatus)];

  // Slide the window: keep only the last 2160 hours
  const trimmed = extended.slice(-totalHours);

  // Calculate new start time
  const newStartMs = startMs + (extended.length - totalHours) * 3600000;
  const newStartTime = new Date(Math.max(newStartMs, startMs)).toISOString();

  return {
    hours: trimmed,
    startTime: newStartTime,
  };
}
