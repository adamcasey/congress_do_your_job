import fs from "node:fs";
import path from "node:path";

const COVERAGE_FILE = path.resolve(process.cwd(), "coverage/coverage-final.json");
const REQUIRED_PERCENT = 100;

const ESSENTIAL_FILES = [
  "src/lib/api-response.ts",
  "src/lib/states.ts",
  "src/app/api/v1/waitlist/route.ts",
  "src/app/api/v1/representatives/route.ts",
  "src/app/api/v1/district/route.ts",
  "src/app/api/v1/autocomplete/route.ts",
  "src/app/api/v1/legislation/recent/route.ts",
  "src/hooks/useWaitlistSignup.ts",
  "src/hooks/useRepresentativeLookup.ts",
];

const ESSENTIAL_METRICS = ["lines", "statements", "functions"];

function calcPercent(covered, total) {
  if (total === 0) return 100;
  return (covered / total) * 100;
}

function summarizeFile(fileCoverage) {
  const statements = Object.values(fileCoverage.s || {});
  const functions = Object.values(fileCoverage.f || {});
  const branchGroups = Object.values(fileCoverage.b || {});
  const branches = branchGroups.flat();

  const statementCovered = statements.filter((count) => count > 0).length;
  const functionCovered = functions.filter((count) => count > 0).length;
  const branchCovered = branches.filter((count) => count > 0).length;

  return {
    lines: calcPercent(statementCovered, statements.length),
    statements: calcPercent(statementCovered, statements.length),
    functions: calcPercent(functionCovered, functions.length),
    branches: calcPercent(branchCovered, branches.length),
  };
}

if (!fs.existsSync(COVERAGE_FILE)) {
  console.error(`Missing coverage file: ${COVERAGE_FILE}`);
  process.exit(1);
}

const coverageMap = JSON.parse(fs.readFileSync(COVERAGE_FILE, "utf8"));
const failures = [];

for (const relativeFile of ESSENTIAL_FILES) {
  const normalized = relativeFile.split(path.sep).join("/");
  const match = Object.entries(coverageMap).find(([coveredPath]) => coveredPath.split(path.sep).join("/").endsWith(normalized));

  if (!match) {
    failures.push({
      file: relativeFile,
      reason: "File not present in coverage output",
    });
    continue;
  }

  const [, fileCoverage] = match;
  const summary = summarizeFile(fileCoverage);
  const belowRequired = ESSENTIAL_METRICS.map((metric) => [metric, summary[metric]]).filter(
    ([, value]) => value < REQUIRED_PERCENT,
  );

  if (belowRequired.length > 0) {
    failures.push({
      file: relativeFile,
      reason: belowRequired.map(([metric, value]) => `${metric}=${value.toFixed(1)}%`).join(", "),
    });
  }
}

if (failures.length > 0) {
  console.error("Essential coverage check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.reason}`);
  }
  process.exit(1);
}

console.log("Essential coverage check passed.");
