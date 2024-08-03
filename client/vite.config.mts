// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  switch (mode) {
    case 'lib':
      return {
        plugins: [
          Vue({
            template: { transformAssetUrls },
          }),
          Vuetify(),
          Components(),
          ViteFonts({
            google: {
              families: [{
                name: 'Roboto',
                styles: 'wght@100;300;400;500;700;900',
              }],
            },
          }),
        ],
        define: { 'process.env': {} },
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
          },
          extensions: [
            '.js',
            '.json',
            '.jsx',
            '.mjs',
            '.ts',
            '.tsx',
            '.vue',
          ],
        },
        build: {
          lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            name: 'coco-client',
          },
          rollupOptions: {
            external: ['vue'],
            output: {
              globals: {
                vue: 'Vue',
              },
            },
          },
        },
      }
    default:
      return {
        plugins: [
          Vue({
            template: { transformAssetUrls },
          }),
          Vuetify(),
          Components(),
          ViteFonts({
            google: {
              families: [{
                name: 'Roboto',
                styles: 'wght@100;300;400;500;700;900',
              }],
            },
          }),
        ],
        define: { 'process.env': {} },
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
          },
          extensions: [
            '.js',
            '.json',
            '.jsx',
            '.mjs',
            '.ts',
            '.tsx',
            '.vue',
          ],
        },
        server: {
          port: 3000,
        },
      }
  }
})
