// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
// If you need __dirname in ESM:
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ ssrBuild }) => ({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      // Point directly at the SDK’s built entry to avoid ERR_UNSUPPORTED_DIR_IMPORT
      "@dimo-network/data-sdk": ssrBuild
        ? path.resolve(
            __dirname,
            "node_modules/@dimo-network/data-sdk/dist/index.cjs",
          )
        : path.resolve(
            __dirname,
            "node_modules/@dimo-network/data-sdk/dist/index.js",
          ),
    },
    // (optional) control file extension resolution
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  optimizeDeps: {
    // ensure Vite prebundles the SDK using the alias above
    include: ["@dimo-network/data-sdk"],
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: { strict: true, deny: ["**/.*"] },
  },
}));
