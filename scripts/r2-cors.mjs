// Lets the admin pages upload straight to the R2 bucket (the browser PUTs to a signed URL).
// Without a CORS policy on the bucket every upload (logo, cover, PDF) fails in the browser with
// "CORS not configured for this bucket". Run it once:  node scripts/r2-cors.mjs
// It reads the R2_* keys from .env.local and changes only this bucket's CORS policy.
import fs from "node:fs";
import { AwsClient } from "aws4fetch";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);

const ORIGINS = ["https://admin.ninelabsolutions.ae", "https://www.admin.ninelabsolutions.ae", "http://admin.localhost:3002", "http://localhost:3002", "http://localhost:3000"];
const xml = `<CORSConfiguration><CORSRule>${ORIGINS.map((o) => `<AllowedOrigin>${o}</AllowedOrigin>`).join("")}<AllowedMethod>PUT</AllowedMethod><AllowedHeader>content-type</AllowedHeader><ExposeHeader>ETag</ExposeHeader><MaxAgeSeconds>3600</MaxAgeSeconds></CORSRule></CORSConfiguration>`;

const s3 = new AwsClient({ accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
const res = await s3.fetch(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}?cors`, { method: "PUT", body: xml, headers: { "Content-Type": "application/xml" } });
console.log(res.status, res.ok ? "CORS set for the admin origins." : await res.text());
