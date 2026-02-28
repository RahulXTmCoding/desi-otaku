import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    allowedHosts: ["localhost", "rahul.tail6c9a2a.ts.net"],
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks - rarely change, long-lived browser cache
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["lucide-react"],
          // Admin code is never loaded by regular users
          "feature-admin": [
            "./src/admin/helper/adminapicall.tsx",
            "./src/admin/helper/productApiHelper.tsx",
            "./src/admin/helper/designapicall.tsx",
          ],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 500,

    // Source maps disabled in production - reduces bundle size and hides source code
    sourcemap: false,

    // Minification options
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
    exclude: ["@vite/client", "@vite/env"],
  },
});
