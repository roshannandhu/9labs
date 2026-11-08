import type { NextConfig } from "next";

/**
 * Frontend demo build: fully static export (`out/`), deployable to any static host
 * (Cloudflare Pages / Workers static assets, Netlify, S3…).
 * When the Payload/D1 backend lands, `output: "export"` is removed and the app moves
 * to Cloudflare Workers via @opennextjs/cloudflare (see docs/PROJECT_PLAN.md).
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
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
