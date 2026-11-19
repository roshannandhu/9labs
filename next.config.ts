import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * Runs on Cloudflare Workers via the OpenNext adapter (`wrangler.jsonc`, `open-next.config.ts`).
 * Public pages render per request; the admin ("The Bridge", `src/studio`) still prerenders as a
 * static client shell at `/admin/` — it talks to the server through `src/server/*` instead of
 * localStorage. NEXT_BASE_PATH lets the same build serve from a sub-path if ever needed.
 */
const nextConfig: NextConfig = {
  basePath: process.env.NEXT_BASE_PATH ?? "",
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_BASE_PATH ?? "",
  },
  reactStrictMode: true,
  // The admin runs on its own host (src/lib/host-route.ts); locally that's admin.localhost.
  allowedDevOrigins: ["admin.localhost"],
  images: { unoptimized: true },
  serverExternalPackages: ["worker-mailer"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
