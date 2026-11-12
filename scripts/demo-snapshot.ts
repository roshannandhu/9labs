/**
 * Takes the snapshot the static GitHub Pages demo is built from: the website's content, its pages
 * and its questions, read from a freshly seeded database. Run after changing the built-in content
 * (src/content/site.ts) or the seed (src/payload/seed.ts):
 *
 *   pnpm demo:snapshot
 *
 * It uses its own scratch database (data/snapshot.db), so your working database is never touched.
 */
import fs from "fs";
import path from "path";

const dbFile = path.resolve("data/snapshot.db");
fs.rmSync(dbFile, { force: true });
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
process.env.DATABASE_URI = `file:${dbFile}`;

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");
const { snapshotFromDb } = await import("../src/lib/content/db");

const payload = await getPayload({ config }); // the first start seeds the database
const snap = await snapshotFromDb(payload);
fs.writeFileSync(path.resolve("src/content/snapshot.json"), JSON.stringify(snap, null, 2) + "\n");
console.log(`Snapshot written: ${snap.pages.length} pages, ${snap.faqs.length} questions, ${snap.site.ebooks.length} books, ${snap.site.services.length} cards.`);
process.exit(0);
