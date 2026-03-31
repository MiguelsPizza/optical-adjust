import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {},
  pack: {
    dts: true,
    exports: true,
  },
  test: {
    coverage: {
      exclude: ["**/index.ts", "../optics-types/**"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: {
        branches: 95,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
