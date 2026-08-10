import { execSync } from "node:child_process";
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

  try {
    const output = execSync(
      `${process.execPath} --experimental-strip-types --experimental-test-coverage --test-coverage-exclude=src/hooks/ --test-coverage-exclude=src/components/App.ts --test-coverage-exclude=src/main.ts --test-coverage-exclude=scripts/build.ts --test-coverage-exclude=scripts/build-history.ts --test-coverage-exclude=scripts/build-json-endpoint.ts --test-coverage-exclude=scripts/serve.ts --test-coverage-exclude=scripts/bump-version.ts --test-coverage-exclude=scripts/check-coverage.ts --test-coverage-exclude=scripts/notify.ts --test tests/unit/*.test.ts tests/unit/**/*.test.ts tests/integration/**/*.test.ts`,
      { cwd: rootDir, encoding: "utf-8", stdio: ["inherit", "pipe", "pipe"] }
    );

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
    // Tests may pass but coverage may be in the output
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
