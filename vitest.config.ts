import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "json", "json-summary"],
      include: [
        "src/app/api/v1/**/*.ts",
        "src/hooks/**/*.ts",
        "src/lib/**/*.ts",
        "src/components/forms/**/*.tsx",
        "src/components/representatives/**/*.tsx",
      ],
      exclude: ["src/lib/launchdarkly-*.ts", "src/lib/prisma*.ts", "src/lib/mongodb.ts", "src/lib/db.ts"],
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 60,
        branches: 60,
      },
    },
  },
});
