import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { parseStatusYaml } from "./yaml-to-json.ts";

type HistogramStatus = "operational" | "degraded" | "down" | "no-data";

interface StatusChange {
  timestamp: string;
  status: HistogramStatus;
  message: string;
}

interface IncidentEntry {
  timestamp: string;
  status: HistogramStatus;
  message: string;
}

interface HistoryData {
  startTime: string;
  totalHours: number;
  generated: string;
  services: Record<string, HistogramStatus[]>;
  messages: Record<string, IncidentEntry[]>;
}

const STATUS_MAP: Record<string, HistogramStatus> = {
  up: "operational",
  degraded: "degraded",
  down: "down",
};

function getGitHistory(rootDir: string): Array<{ hash: string; date: string }> {
  try {
    const output = execFileSync("git", [
      "log",
      "--follow",
      "--format=%H %aI",
      "--diff-filter=ACMR",
      "--",
      "status.yaml",
    ], { cwd: rootDir, encoding: "utf-8" });

    return output
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => {
        const [hash, ...dateParts] = line.split(" ");
        return { hash, date: dateParts.join(" ") };
      });
  } catch {
    return [];
  }
}

function getFileAtCommit(rootDir: string, hash: string, path: string): string | null {
  try {
    return execFileSync("git", ["show", `${hash}:${path}`], {
      cwd: rootDir,
      encoding: "utf-8",
    });
  } catch {
    return null;
  }
}

function extractStatusTimeline(
  rootDir: string,
  commits: Array<{ hash: string; date: string }>
): Record<string, StatusChange[]> {
  const timelines: Record<string, StatusChange[]> = {};

  // Process commits from oldest to newest
  const ordered = [...commits].reverse();

  for (const commit of ordered) {
    const content = getFileAtCommit(rootDir, commit.hash, "status.yaml");
    if (!content) continue;

    let data;
    try {
      data = parseStatusYaml(content);
    } catch {
      continue;
    }

    for (const svc of data.services) {
      if (!timelines[svc.name]) {
        timelines[svc.name] = [];
      }

      const mappedStatus = STATUS_MAP[svc.status] || "no-data";
      const timestamp = svc.updated || commit.date;
      const message = svc.message || "";

      const timeline = timelines[svc.name];
      const last = timeline[timeline.length - 1];

      // Record if status or message changed
      if (!last || last.status !== mappedStatus || last.message !== message) {
        timeline.push({ timestamp, status: mappedStatus, message });
      }
    }
  }

  return timelines;
}

function buildHourlyHistogram(
  timelines: Record<string, StatusChange[]>,
  startTime: Date,
  totalHours: number
): Record<string, HistogramStatus[]> {
  const result: Record<string, HistogramStatus[]> = {};

  for (const [service, changes] of Object.entries(timelines)) {
    const hours: HistogramStatus[] = new Array(totalHours).fill("no-data");

    for (let h = 0; h < totalHours; h++) {
      const hourEnd = new Date(startTime.getTime() + (h + 1) * 3600000);

      // Find the most recent status change within or before this hour
      let currentStatus: HistogramStatus = "no-data";
      for (const change of changes) {
        const changeTime = new Date(change.timestamp);
        if (changeTime < hourEnd) {
          currentStatus = change.status;
        } else {
          break;
        }
      }

      hours[h] = currentStatus;
    }

    result[service] = hours;
  }

  return result;
}

function main(): void {
  const rootDir = resolve(import.meta.dirname, "..");
  const distDir = resolve(rootDir, "dist");
  const totalHours = 90 * 24; // 90 days

  const now = new Date();
  const startTime = new Date(now.getTime() - totalHours * 3600000);
  // Round start to the beginning of the hour
  startTime.setMinutes(0, 0, 0);

  console.log("Extracting git history for status.yaml...");
  const commits = getGitHistory(rootDir);
  console.log(`Found ${commits.length} commits affecting status.yaml`);

  const timelines = extractStatusTimeline(rootDir, commits);
  const serviceNames = Object.keys(timelines);
  console.log(`Tracking ${serviceNames.length} services: ${serviceNames.join(", ")}`);

  const histogram = buildHourlyHistogram(timelines, startTime, totalHours);

  // Build message history per service (newest first)
  const messages: Record<string, IncidentEntry[]> = {};
  for (const [name, changes] of Object.entries(timelines)) {
    messages[name] = changes
      .map((c) => ({ timestamp: c.timestamp, status: c.status, message: c.message }))
      .reverse();
  }

  const historyData: HistoryData = {
    startTime: startTime.toISOString(),
    totalHours,
    generated: now.toISOString(),
    services: histogram,
    messages,
  };

  mkdirSync(distDir, { recursive: true });
  writeFileSync(resolve(distDir, "history.json"), JSON.stringify(historyData) + "\n");

  console.log(`Built ${totalHours}-hour histogram → dist/history.json`);
}

export { extractStatusTimeline, buildHourlyHistogram, STATUS_MAP };
export type { HistogramStatus, StatusChange, IncidentEntry, HistoryData };

const isMain = process.argv[1]?.endsWith("build-history.ts");
if (isMain) {
  main();
}
