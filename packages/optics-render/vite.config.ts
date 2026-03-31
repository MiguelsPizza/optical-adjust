import { fileURLToPath } from "node:url";

import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser/providers/playwright";

const workspaceAlias = {
  optics: fileURLToPath(new URL("../optics/src/index.ts", import.meta.url)),
  "optics-constants": fileURLToPath(new URL("../optics-constants/src/index.ts", import.meta.url)),
  "optics-types": fileURLToPath(new URL("../optics-types/src/index.ts", import.meta.url)),
} as const;

export default defineConfig({
  fmt: {},
  lint: {},
  pack: {
    dts: true,
    exports: true,
  },
  resolve: {
    alias: workspaceAlias,
  },
  test: {
    browser: {
      connectTimeout: 120_000,
      enabled: true,
      headless: true,
      instances: [
        {
          browser: "chromium",
        },
      ],
      provider: playwright({
        launchOptions: {
          args: ["--disable-dev-shm-usage", "--no-sandbox"],
          headless: true,
        },
      }),
    },
    fileParallelism: false,
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
});
