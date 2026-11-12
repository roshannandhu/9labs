import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * One app: the public website (src/app/(site)) and the admin panel (src/app/(payload), Payload CMS).
 * It runs on a Node server, where content is read from the database on each request.
 *
 * The static GitHub Pages demo is a separate build of the same code (DEMO_STATIC=1):
 * `pnpm demo:build` (see scripts/build-demo.mjs). It exports plain files under /9labs/.
 */
const demo = process.env.DEMO_STATIC === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // lets the demo build's code see its mode at build time (the static files never read the environment)
  env: {
    DEMO_STATIC: demo ? "1" : "",
    NEXT_PUBLIC_DEMO_STATIC: demo ? "1" : "",
    // the folder the demo lives in ("" on the server); plain links add it, see src/lib/site-href.ts
    NEXT_PUBLIC_BASE_PATH: demo ? (process.env.NEXT_BASE_PATH ?? "/9labs") : "",
  },
  ...(demo
    ? {
        output: "export",
        trailingSlash: true,
        basePath: process.env.NEXT_BASE_PATH ?? "",
      }
    : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default demo ? nextConfig : withPayload(nextConfig);
