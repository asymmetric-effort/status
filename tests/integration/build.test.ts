import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = resolve(import.meta.dirname, "../..");
const distDir = resolve(rootDir, "dist");

describe("build output", () => {
  // Run the build before tests
  it("build completes successfully", () => {
    execFileSync(process.execPath, [
      "--experimental-strip-types",
      resolve(rootDir, "scripts/build.ts"),
    ], { cwd: rootDir, stdio: "pipe" });

    expect(existsSync(distDir)).toBe(true);
  });

  it("produces index.html", () => {
    const indexPath = resolve(distDir, "index.html");
    expect(existsSync(indexPath)).toBe(true);
    const content = readFileSync(indexPath, "utf-8");
    expect(content).toContain("<!DOCTYPE html>");
    expect(content).toContain('id="root"');
    expect(content).toContain("importmap");
  });

  it("produces main.js", () => {
    const mainPath = resolve(distDir, "main.js");
    expect(existsSync(mainPath)).toBe(true);
    const content = readFileSync(mainPath, "utf-8");
    expect(content).toContain("createRoot");
  });

  it("produces styles.css", () => {
    const cssPath = resolve(distDir, "styles.css");
    expect(existsSync(cssPath)).toBe(true);
    const content = readFileSync(cssPath, "utf-8");
    expect(content).toContain(".service-card");
    expect(content).toContain(".status-badge");
  });

  it("produces status.json", () => {
    const jsonPath = resolve(distDir, "status.json");
    expect(existsSync(jsonPath)).toBe(true);
    const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
    expect(data.title).toBeDefined();
    expect(Array.isArray(data.services)).toBe(true);
  });

  it("produces vendor/specifyjs directory", () => {
    const vendorPath = resolve(distDir, "vendor/specifyjs/index.js");
    expect(existsSync(vendorPath)).toBe(true);
  });

  it("produces component JS files", () => {
    for (const component of ["App", "Header", "Footer", "ServiceCard", "StatusBadge"]) {
      const path = resolve(distDir, `components/${component}.js`);
      expect(existsSync(path)).toBe(true);
    }
  });
});
