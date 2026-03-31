import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {},
  pack: {
    dts: true,
    exports: true,
  },
});
