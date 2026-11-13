import type { NextConfig } from "next";

/**
 * Fully static export (`out/`), deployable to any static host (Cloudflare Pages/Workers static
 * assets, Netlify, S3, GitHub Pages…). The admin ("The Bridge", `src/studio`) is part of this
 * same static build, at `/admin/` — it runs entirely in the browser (see `src/lib/store.ts`).
 *
 * NEXT_BASE_PATH lets the same build serve from a sub-path (e.g. GitHub Pages' `/9labs/`).
 */
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_BASE_PATH ?? "",
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_BASE_PATH ?? "",
    // shown small in the footer, so a stale cached copy of the demo is easy to spot
    NEXT_PUBLIC_BUILD: new Date().toISOString().slice(0, 16).replace("T", " "),
  },
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
