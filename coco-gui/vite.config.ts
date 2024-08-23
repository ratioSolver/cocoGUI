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
      external: ['vue', 'chroma-js', 'cytoscape', 'cytoscape-dagre', 'cytoscape-popper', 'leaflet', 'naive-ui', 'plotly.js-dist-min', 'highlight.js', 'tippy.js'],
      output: {
        globals: {
          vue: "Vue",
          "chroma-js": "chroma",
          cytoscape: "cytoscape",
          "cytoscape-dagre": "cytoscapeDagre",
          "cytoscape-popper": "cytoscapePopper",
          leaflet: "L",
          "naive-ui": "naive-ui",
          "plotly.js-dist-min": "Plotly",
          "highlight.js": "hljs",
          "tippy.js": "tippy"
        },
      },
    },
  },
});