import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      // next-auth importa "next/server" sem extensão; em Node ESM puro o
      // vitest precisa da forma com .js
      { find: /^next\/server$/, replacement: "next/server.js" },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // integração usa o mesmo Postgres de dev (dados de seed não são tocados;
    // cada teste cria e remove seus próprios registros)
    env: loadDotEnv(),
    testTimeout: 20_000,
  },
});

function loadDotEnv(): Record<string, string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    const content = fs.readFileSync(path.resolve(__dirname, ".env"), "utf8");
    const out: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  } catch {
    return {};
  }
}
