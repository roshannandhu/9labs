/**
 * Builds the static GitHub Pages demo into ./out (served under /9labs/).
 *
 *   pnpm demo:snapshot   # only when the built-in content changed (see scripts/demo-snapshot.ts)
 *   pnpm demo:build
 *
 * The same code is built from a scratch copy in .demo-build, so the server build is never touched:
 * the admin, the API routes and the dynamic download route are left out, the content comes from
 * src/content/snapshot.json, and the force-dynamic settings become static.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { execFileSync } from "child_process";

const root = process.cwd();
const work = path.join(root, ".demo-build");
const out = path.join(root, "out");
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", ...opts });

if (!existsSync(path.join(root, "src/content/snapshot.json"))) {
  console.error("No snapshot yet: run `pnpm demo:snapshot` first.");
  process.exit(1);
}

// 1. a clean scratch copy of the source (node_modules is hard-linked, not copied)
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
for (const item of ["src", "public", "scripts", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "next.config.ts", "eslint.config.mjs"]) {
  if (existsSync(path.join(root, item))) cpSync(path.join(root, item), path.join(work, item), { recursive: true });
}
run("cp", ["-al", path.join(root, "node_modules"), path.join(work, "node_modules")]);

// 2. what a static site cannot have: the admin, the API, the per-request download, the request-time proxy
for (const item of ["src/app/(payload)", "src/app/api", "src/app/(site)/download", "src/proxy.ts"]) {
  rmSync(path.join(work, item), { recursive: true, force: true });
}

// 3. the content comes from the snapshot instead of the database
cpSync(path.join(work, "scripts/demo/getSite.ts"), path.join(work, "src/lib/content/getSite.ts"));
cpSync(path.join(work, "scripts/demo/pages.ts"), path.join(work, "src/lib/content/pages.ts"));

// 4. pages that are read per request on the server are built once for the demo
const staticFiles = ["src/app/(site)/layout.tsx", "src/app/robots.ts", "src/app/sitemap.ts"];
for (const f of staticFiles) {
  const p = path.join(work, f);
  const s = readFileSync(p, "utf8");
  if (!s.includes('export const dynamic = "force-dynamic";')) throw new Error(`expected force-dynamic in ${f}`);
  writeFileSync(p, s.replace('export const dynamic = "force-dynamic";', 'export const dynamic = "force-static";'));
}

// 5. build: plain files, under /9labs/, kept out of search engines
run("pnpm", ["exec", "next", "build"], {
  cwd: work,
  env: {
    ...process.env,
    DEMO_STATIC: "1",
    NEXT_PUBLIC_DEMO_STATIC: "1",
    NEXT_BASE_PATH: process.env.NEXT_BASE_PATH ?? "/9labs",
    // the address the demo is published at (GitHub Pages: https://<owner>.github.io/<repo>)
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "https://roshannandhu.github.io/9labs",
    NEXT_PUBLIC_NOINDEX: "1",
  },
});

// 6. the result
rmSync(out, { recursive: true, force: true });
cpSync(path.join(work, "out"), out, { recursive: true });
console.log(`\nDemo built into ${path.relative(root, out)}/ (base path ${process.env.NEXT_BASE_PATH ?? "/9labs"}).`);
