import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs(args: string[]): { service: string; status: string; message: string } {
  let service = "";
  let status = "";
  let message = "";

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--service":
        service = args[++i];
        break;
      case "--status":
        status = args[++i];
        break;
      case "--message":
        message = args[++i];
        break;
    }
  }

  if (!service || !status) {
    console.error("Usage: yaml-update --service <name> --status <up|down|degraded> --message <msg>");
    process.exit(1);
  }

  if (!["up", "down", "degraded"].includes(status)) {
    console.error(`Invalid status: "${status}". Must be one of: up, down, degraded`);
    process.exit(1);
  }

  return { service, status, message };
}

function updateServiceInYaml(content: string, service: string, status: string, message: string): string {
  const lines = content.split("\n");
  const now = new Date().toISOString();
  let inTargetService = false;
  let serviceFound = false;
  let fieldIndent = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect start of a service block
    if (trimmed.startsWith("- name:")) {
      const nameMatch = trimmed.match(/^- name:\s*"?(.*?)"?\s*$/);
      if (nameMatch && nameMatch[1] === service) {
        inTargetService = true;
        serviceFound = true;
        // Field indent = leading whitespace of "- name:" line + "  " (to align with "name" after "- ")
        const listIndent = line.match(/^(\s*)/)?.[1] || "";
        fieldIndent = listIndent + "  ";
        continue;
      } else {
        inTargetService = false;
        continue;
      }
    }

    if (inTargetService) {
      // Check if we've left the service block (new list item or non-indented line)
      if (trimmed.startsWith("- ") || (trimmed !== "" && !line.startsWith(fieldIndent))) {
        inTargetService = false;
        continue;
      }

      if (trimmed.startsWith("status:")) {
        lines[i] = `${fieldIndent}status: "${status}"`;
      } else if (trimmed.startsWith("message:")) {
        lines[i] = `${fieldIndent}message: "${message}"`;
      } else if (trimmed.startsWith("updated:")) {
        lines[i] = `${fieldIndent}updated: "${now}"`;
      }
    }
  }

  if (!serviceFound) {
    // Append new service
    const newEntry = [
      `  - name: "${service}"`,
      `    status: "${status}"`,
      `    message: "${message}"`,
      `    updated: "${now}"`,
    ].join("\n");

    // Find the end of the services list or append
    const result = content.trimEnd() + "\n" + newEntry + "\n";
    return result;
  }

  return lines.join("\n");
}

function main(): void {
  const { service, status, message } = parseArgs(process.argv.slice(2));
  const rootDir = resolve(import.meta.dirname, "..");
  const yamlPath = resolve(rootDir, "status.yaml");

  const content = readFileSync(yamlPath, "utf-8");
  const updated = updateServiceInYaml(content, service, status, message);
  writeFileSync(yamlPath, updated);

  console.log(`Updated service "${service}" → status: ${status}`);
}

export { updateServiceInYaml, parseArgs };

const isMain = process.argv[1]?.endsWith("yaml-update.ts");
if (isMain) {
  main();
}
