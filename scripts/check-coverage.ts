import { execSync } from "node:child_process";
import { resolve } from "node:path";

const THRESHOLD = 98;

function main(): void {
  const rootDir = resolve(import.meta.dirname, "..");

  console.log(`Running tests with coverage (threshold: ${THRESHOLD}%)...`);

  try {
    const output = execSync(
      `${process.execPath} --experimental-strip-types --experimental-test-coverage --test tests/unit/**/*.test.ts tests/integration/**/*.test.ts`,
      { cwd: rootDir, encoding: "utf-8", stdio: ["inherit", "pipe", "pipe"] }
    );

    process.stdout.write(output);

    // Parse coverage summary from Node's test runner output
    // Format: "# all files ... line% ... branch% ... function%"
    const coverageMatch = output.match(/# all files\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      const coverage = parseFloat(coverageMatch[1]);
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
    if (err.stdout) process.stdout.write(err.stdout);
    if (err.stderr) process.stderr.write(err.stderr);
    console.error("\nTests failed.");
    process.exit(1);
  }
}

main();
