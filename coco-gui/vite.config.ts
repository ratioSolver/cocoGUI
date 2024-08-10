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
      name: "coco-lib",
    },
    rollupOptions: {
      external: ["vue", "pinia", "vue-router", "naive-ui", "chroma-js", "cytoscape", "cytoscape-dagre", "cytoscape-popper", "highlight.js", "leaflet", "@vicons/fluent"],
      output: {
        globals: {
          vue: "Vue",
          pinia: "Pinia",
          "vue-router": "VueRouter",
          "naive-ui": "naive-ui",
          "chroma-js": "chroma",
          cytoscape: "cytoscape",
          "cytoscape-dagre": "cytoscapeDagre",
          "cytoscape-popper": "cytoscapePopper",
          "highlight.js": "hljs",
          leaflet: "L",
          "@vicons/fluent": "Fluent"
        },
      },
    },
  },
});