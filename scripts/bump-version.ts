import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Bump = "major" | "minor" | "patch";

function getLatestTag(): string | null {
  try {
    return execSync("git describe --tags --abbrev=0", { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function parseSemver(tag: string): [number, number, number] {
  const match = tag.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid semver tag: ${tag}`);
  }
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

function bumpVersion(version: [number, number, number], bump: Bump): string {
  const [major, minor, patch] = version;
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

function main(): void {
  const bump = process.argv[2] as Bump;
  if (!["major", "minor", "patch"].includes(bump)) {
    console.error("Usage: bump-version.ts <major|minor|patch>");
    process.exit(1);
  }

  const tag = getLatestTag();
  if (!tag) {
    console.error("No existing tags found. Run 'make version' first to create v0.0.0.");
    process.exit(1);
  }

  const current = parseSemver(tag);
  const next = bumpVersion(current, bump);
  const newTag = `v${next}`;

  // Update package.json
  const rootDir = resolve(import.meta.dirname, "..");
  const pkgPath = resolve(rootDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.version = next;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // Commit and tag
  execSync(`git add package.json`, { stdio: "inherit" });
  execSync(`git commit -m "chore: bump version to ${next}"`, { stdio: "inherit" });
  execSync(`git tag -a ${newTag} -m "Release ${newTag}"`, { stdio: "inherit" });

  console.log(`Version bumped: ${tag} → ${newTag}`);
}

main();
