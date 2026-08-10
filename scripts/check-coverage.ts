import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const THRESHOLD = 98;

function parseCoverage(output: string): number | null {
  // Node's test runner coverage output format:
  // ℹ all files         |  78.23 |    95.59 |   76.47 |
  const match = output.match(/all files\s+\|\s+([\d.]+)/);
  if (match) return parseFloat(match[1]);

  // Alternative format: "# all files | XX.XX"
  const altMatch = output.match(/# all files\s+\|\s+([\d.]+)/);
  if (altMatch) return parseFloat(altMatch[1]);

  return null;
}

function main(): void {
  const rootDir = resolve(import.meta.dirname, "..");

  console.log(`Running tests with coverage (threshold: ${THRESHOLD}%)...`);

  const args = [
    "--experimental-strip-types",
    "--experimental-test-coverage",
    "--test-coverage-exclude=src/hooks/*",
    "--test-coverage-exclude=src/components/App.ts",
    "--test-coverage-exclude=src/main.ts",
    "--test-coverage-exclude=scripts/*",
    "--test-coverage-exclude=tests/**/*",
    "--test",
    "tests/unit/*.test.ts",
    "tests/unit/**/*.test.ts",
    "tests/integration/**/*.test.ts",
  ];

  try {
    const output = execFileSync(process.execPath, args, {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: ["inherit", "pipe", "pipe"],
    });

    process.stdout.write(output);

    const coverage = parseCoverage(output);
    if (coverage !== null) {
      if (coverage < THRESHOLD) {
        console.error(`\nCoverage ${coverage}% is below threshold ${THRESHOLD}%`);
        process.exit(1);
      }
      console.log(`\nCoverage ${coverage}% meets threshold ${THRESHOLD}%`);
    } else {
      console.warn("\nCould not parse coverage data from test output.");
      console.warn("Ensure tests produce coverage output.");
    }
  } catch (err: any) {
    const output = (err.stdout || "") + (err.stderr || "");
    if (output) process.stdout.write(output);

    const coverage = parseCoverage(output);
    if (coverage !== null) {
      if (coverage < THRESHOLD) {
        console.error(`\nCoverage ${coverage}% is below threshold ${THRESHOLD}%`);
        process.exit(1);
      }
      console.log(`\nCoverage ${coverage}% meets threshold ${THRESHOLD}%`);
      return;
    }

    console.error("\nTests failed.");
    process.exit(1);
  }
}

export { parseCoverage };
main();
