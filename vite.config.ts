import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {},
  test: {
    exclude: ["**/*.browser.test.ts", "**/node_modules/**", "packages/optics-render/tests/**"],
    include: ["packages/**/*.test.ts"],
  },
});
