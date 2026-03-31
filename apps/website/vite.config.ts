import { fileURLToPath } from "node:url";

import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser/providers/playwright";

export default defineConfig({
  resolve: {
    alias: {
      optics: fileURLToPath(new URL("../../packages/optics/src/index.ts", import.meta.url)),
      "optics-constants": fileURLToPath(
        new URL("../../packages/optics-constants/src/index.ts", import.meta.url),
      ),
      "optics-render": fileURLToPath(
        new URL("../../packages/optics-render/src/index.ts", import.meta.url),
      ),
      "optics-types": fileURLToPath(
        new URL("../../packages/optics-types/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    browser: {
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
    include: ["src/**/*.browser.test.ts"],
  },
});
