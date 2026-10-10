import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Classic dynamic rendering: the dashboard polls live data and the API
  // routes must never be cached. Cache Components would force Suspense
  // boundaries everywhere, which is not worth it for a 12-hour build.
  cacheComponents: false,
  // The repo already has CLAUDE.md; do not let Next regenerate AGENTS.md.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
