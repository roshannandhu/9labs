import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * One app: the public website (src/app/(site)) and the admin panel (src/app/(payload), Payload CMS).
 * It needs a Node server — it is no longer a static export.
 */
const nextConfig: NextConfig = {
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

export default withPayload(nextConfig);
