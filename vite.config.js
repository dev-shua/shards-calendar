import { defineConfig } from "vite";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const SRC_ALIASES = [
  "core",
  "lib",
  "module",
  "ui",
  "utils",
]

export default defineConfig({
  plugins: [svelte()],
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/module/main.js",
      output: { 
        entryFileNames: "module.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) return "styles/module.css";
          return "assets/[name]-[hash][extname]";
        }
      }
    }
  },
  resolve: {
    alias: Object.fromEntries(
      SRC_ALIASES.map((name) => [`@${name}`, path.resolve(__dirname, `src/${name}`),])
    )
  }
})