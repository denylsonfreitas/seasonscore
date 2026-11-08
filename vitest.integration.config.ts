import { defineConfig } from "vitest/config";

// Testes contra um projeto Supabase real (veja src/integration).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/integration/**/*.integration.test.ts"],
    testTimeout: 30000,
    fileParallelism: false,
    pool: "forks",
  },
});
