import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set by the Tauri CLI; WebView2 (Windows) is Chromium, macOS/Linux use WebKit.
const platform = process.env.TAURI_ENV_PLATFORM;
const debug = !!process.env.TAURI_ENV_DEBUG;

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_ENV_"],
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    target: platform === "windows" ? "chrome105" : "safari15",
    minify: debug ? false : "esbuild",
    sourcemap: debug,
  },
});
