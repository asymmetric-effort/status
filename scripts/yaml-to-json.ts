import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

interface Service {
  name: string;
  status: string;
  message: string;
  updated: string;
}

interface StatusData {
  title: string;
  url: string;
  services: Service[];
}

function parseStatusYaml(content: string): StatusData {
  const lines = content.split("\n");
  const result: StatusData = { title: "", url: "", services: [] };
  let currentService: Partial<Service> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    // Top-level scalar: title or url
    const topMatch = trimmed.match(/^(title|url):\s*"?(.*?)"?\s*$/);
    if (topMatch) {
      const key = topMatch[1] as "title" | "url";
      result[key] = topMatch[2];
      continue;
    }

    // Services array key (just the label)
    if (trimmed === "services:") continue;

    // New service item (starts with "- ")
    if (trimmed.startsWith("- ")) {
      if (currentService && currentService.name) {
        result.services.push(currentService as Service);
      }
      currentService = {};
      const fieldMatch = trimmed.slice(2).match(/^(\w+):\s*"?(.*?)"?\s*$/);
      if (fieldMatch) {
        (currentService as any)[fieldMatch[1]] = fieldMatch[2];
      }
      continue;
    }

    // Continuation field of current service
    if (currentService) {
      const fieldMatch = trimmed.match(/^(\w+):\s*"?(.*?)"?\s*$/);
      if (fieldMatch) {
        (currentService as any)[fieldMatch[1]] = fieldMatch[2];
      }
    }
  }

  if (currentService && currentService.name) {
    result.services.push(currentService as Service);
  }

  return result;
}

function main(): void {
  const rootDir = resolve(import.meta.dirname, "..");
  const yamlPath = resolve(rootDir, "status.yaml");
  const distDir = resolve(rootDir, "dist");
  const jsonPath = resolve(distDir, "status.json");
  const jsonEndpointDir = resolve(distDir, "json");

  const content = readFileSync(yamlPath, "utf-8");
  const data = parseStatusYaml(content);
  const jsonOutput = JSON.stringify(data, null, 2) + "\n";

  mkdirSync(distDir, { recursive: true });
  mkdirSync(jsonEndpointDir, { recursive: true });

  writeFileSync(jsonPath, jsonOutput);

  // /json endpoint: copy as extensionless file for /json path
  writeFileSync(resolve(jsonEndpointDir, "index.html"), jsonOutput);

  console.log(`Converted status.yaml → dist/status.json + dist/json/ (${data.services.length} services)`);
}

export { parseStatusYaml };

// Only run when executed directly
const isMain = process.argv[1]?.endsWith("yaml-to-json.ts");
if (isMain) {
  main();
}
