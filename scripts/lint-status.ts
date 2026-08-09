import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseStatusYaml } from "./yaml-to-json.ts";

const VALID_STATUSES = ["up", "down", "degraded"];

interface LintError {
  message: string;
}

function lintStatusYaml(content: string): LintError[] {
  const errors: LintError[] = [];

  if (content.trim() === "") {
    errors.push({ message: "status.yaml is empty" });
    return errors;
  }

  let data;
  try {
    data = parseStatusYaml(content);
  } catch (err) {
    errors.push({ message: `Failed to parse status.yaml: ${err instanceof Error ? err.message : String(err)}` });
    return errors;
  }

  if (typeof data.title !== "string" || data.title.trim() === "") {
    errors.push({ message: "Missing or empty 'title' field" });
  }

  if (typeof data.url !== "string") {
    errors.push({ message: "Missing 'url' field" });
  }

  if (!Array.isArray(data.services)) {
    errors.push({ message: "'services' must be an array" });
    return errors;
  }

  const names = new Set<string>();

  for (let i = 0; i < data.services.length; i++) {
    const svc = data.services[i];
    const prefix = `services[${i}]`;

    if (typeof svc.name !== "string" || svc.name.trim() === "") {
      errors.push({ message: `${prefix}: missing or empty 'name'` });
    } else if (names.has(svc.name)) {
      errors.push({ message: `${prefix}: duplicate service name '${svc.name}'` });
    } else {
      names.add(svc.name);
    }

    if (!VALID_STATUSES.includes(svc.status)) {
      errors.push({ message: `${prefix}: invalid status '${svc.status}' (must be up, down, or degraded)` });
    }

    if (typeof svc.message !== "string" || svc.message.trim() === "") {
      errors.push({ message: `${prefix}: missing or empty 'message'` });
    }

    if (typeof svc.updated !== "string" || svc.updated.trim() === "") {
      errors.push({ message: `${prefix}: missing or empty 'updated'` });
    } else if (isNaN(new Date(svc.updated).getTime())) {
      errors.push({ message: `${prefix}: 'updated' is not a valid ISO timestamp` });
    }
  }

  return errors;
}

export { lintStatusYaml };

const isMain = process.argv[1]?.endsWith("lint-status.ts");
if (isMain) {
  const rootDir = resolve(import.meta.dirname, "..");
  const yamlPath = resolve(rootDir, "status.yaml");
  const content = readFileSync(yamlPath, "utf-8");
  const errors = lintStatusYaml(content);

  if (errors.length === 0) {
    console.log("status.yaml: OK");
  } else {
    console.error(`status.yaml: ${errors.length} error(s) found:`);
    for (const err of errors) {
      console.error(`  - ${err.message}`);
    }
    process.exit(1);
  }
}
