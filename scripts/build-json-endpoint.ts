import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function main(): void {
  const rootDir = resolve(import.meta.dirname, "..");
  const distDir = resolve(rootDir, "dist");
  const jsonEndpointDir = resolve(distDir, "json");

  const statusPath = resolve(distDir, "status.json");
  const historyPath = resolve(distDir, "history.json");
  const versionPath = resolve(distDir, "version.json");

  const status = JSON.parse(readFileSync(statusPath, "utf-8"));

  let history = null;
  if (existsSync(historyPath)) {
    history = JSON.parse(readFileSync(historyPath, "utf-8"));
  }

  let version = "v0.0.0";
  if (existsSync(versionPath)) {
    version = JSON.parse(readFileSync(versionPath, "utf-8")).version || "v0.0.0";
  }

  const combined = {
    version,
    ...status,
    history: history ? {
      startTime: history.startTime,
      totalHours: history.totalHours,
      generated: history.generated,
      services: history.services,
      messages: history.messages,
    } : null,
  };

  mkdirSync(jsonEndpointDir, { recursive: true });
  const output = JSON.stringify(combined, null, 2) + "\n";
  writeFileSync(resolve(jsonEndpointDir, "index.html"), output);

  console.log("Built /json endpoint with status + history data.");
}

const isMain = process.argv[1]?.endsWith("build-json-endpoint.ts");
if (isMain) {
  main();
}
