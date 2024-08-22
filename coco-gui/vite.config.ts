import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "coco-gui",
    },
    rollupOptions: {
      external: ["vue", "pinia", "vue-router", "naive-ui", "@vicons/fluent"],
      output: {
        globals: {
          vue: "Vue",
          pinia: "Pinia",
          "vue-router": "VueRouter",
          "naive-ui": "naive-ui",
          "@vicons/fluent": "VFluent",
        },
      },
    },
  },
});