import { mkdirSync, copyFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";

function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

async function build(): Promise<void> {
  const rootDir = resolve(import.meta.dirname, "..");
  const distDir = resolve(rootDir, "dist");

  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  // Step 1: Compile TypeScript → ES modules in dist/
  console.log("Compiling TypeScript...");
  execFileSync(process.execPath, [
    resolve(rootDir, "node_modules/.bin/tsc"),
    "--project", resolve(rootDir, "tsconfig.build.json"),
  ], { cwd: rootDir, stdio: "inherit" });

  // Step 2: Copy specifyjs vendor ESM (with chunks)
  console.log("Copying vendor libraries...");
  const specifyEsmDir = resolve(rootDir, "node_modules/@asymmetric-effort/specifyjs/dist/esm");
  copyDirRecursive(specifyEsmDir, resolve(distDir, "vendor/specifyjs"));

  // Step 3: Copy static assets
  console.log("Copying static assets...");
  copyFileSync(resolve(rootDir, "index.html"), resolve(distDir, "index.html"));
  copyFileSync(resolve(rootDir, "src/styles.css"), resolve(distDir, "styles.css"));

  if (existsSync(resolve(rootDir, "CNAME"))) {
    copyFileSync(resolve(rootDir, "CNAME"), resolve(distDir, "CNAME"));
  }

  // Step 4: Convert status.yaml → status.json
  console.log("Converting status.yaml → status.json...");
  execFileSync(process.execPath, [
    "--experimental-strip-types",
    resolve(rootDir, "scripts/yaml-to-json.ts"),
  ], { stdio: "inherit" });

  console.log("Build complete → dist/");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
