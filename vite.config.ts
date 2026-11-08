import { defineConfig, loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

const vendorChunks: Record<string, string[]> = {
  vendor: ["react", "react-dom", "react-router", "react-router-dom", "scheduler"],
  ui: ["@chakra-ui", "@emotion", "framer-motion"],
  supabase: ["@supabase"],
  utils: ["date-fns"],
};

/**
 * Serve /api/tmdb localmente (dev e preview) usando a mesma função da Vercel.
 * A chave vem de TMDB_API_KEY (ou VITE_TMDB_API_KEY) no .env.local.
 */
function tmdbProxy(): Plugin {
  const attach = (server: ViteDevServer | PreviewServer, mode: string) => {
    const env = loadEnv(mode, process.cwd(), "");
    process.env.TMDB_API_KEY ??= env.TMDB_API_KEY || env.VITE_TMDB_API_KEY;
    server.middlewares.use("/api/tmdb", async (req, res) => {
      const { GET } = await import("./api/tmdb");
      const response = await GET(new Request(`http://localhost${req.originalUrl ?? req.url}`));
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(await response.text());
    });
  };
  return {
    name: "tmdb-proxy",
    configureServer(server) {
      attach(server, server.config.mode);
    },
    configurePreviewServer(server) {
      attach(server, server.config.mode);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tmdbProxy()],
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          for (const [chunk, packages] of Object.entries(vendorChunks)) {
            if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) {
              return chunk;
            }
          }
          return undefined;
        },
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    sourcemap: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
  },
  server: {
    hmr: {
      overlay: true,
    },
    fs: {
      strict: true,
      allow: ["."],
      deny: [".git", ".env", ".env.*", "node_modules/.cache", "**/node_modules/**/.git"],
    },
  },
  preview: {
    port: 4173,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "@chakra-ui/react"],
  },
});
