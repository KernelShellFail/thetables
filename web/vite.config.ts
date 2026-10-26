import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    // The web app uses the library source directly, so changes to the engine
    // show up in the browser without a build step. The library stays free of
    // any Node-specific code, which is what makes this possible.
    alias: {
      "basit-arabic-engine/interactive": fileURLToPath(
        new URL("../src/interactive.ts", import.meta.url)
      ),
      "basit-arabic-engine": fileURLToPath(
        new URL("../src/index.ts", import.meta.url)
      )
    }
  },
  server: {
    fs: {
      // The library lives one directory above the app root.
      allow: [".."]
    }
  }
});