import "server-only";
import { AwsClient } from "aws4fetch";
import { env, r2Configured } from "./env";
import * as devStorage from "./devStorage";

let client: AwsClient | undefined;

function s3(): AwsClient {
  if (!client) {
    client = new AwsClient({
      accessKeyId: env().R2_ACCESS_KEY_ID,
      secretAccessKey: env().R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });
  }
  return client;
}

const bucketUrl = () => `https://${env().R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env().R2_BUCKET}`;

/**
 * A time-limited URL the browser can PUT a file straight to, with no server in the middle.
 *
 * ponytail: before R2 is configured, this hands out a URL into devStorage.ts (local disk) instead
 * — same contract, same caller, zero R2 account needed for local testing. Upgrade: once
 * R2_ACCOUNT_ID etc. are set (in Cloudflare too), this function stops calling devStorage at all,
 * on its own — nothing else to change.
 */
export async function presignPut(key: string, seconds = 600): Promise<string> {
  if (!r2Configured()) return devStorage.presignPut(key);
  const url = new URL(`${bucketUrl()}/${key}`);
  url.searchParams.set("X-Amz-Expires", String(seconds));
  const signed = await s3().sign(url.toString(), { method: "PUT", aws: { signQuery: true } });
  return signed.url;
}

export async function getObject(key: string): Promise<Response> {
  if (!r2Configured()) return devStorage.getObject(key);
  return s3().fetch(`${bucketUrl()}/${key}`);
}

export async function putObject(key: string, body: string, contentType: string): Promise<void> {
  if (!r2Configured()) return devStorage.writeFile(key, new TextEncoder().encode(body).buffer as ArrayBuffer);
  const res = await s3().fetch(`${bucketUrl()}/${key}`, { method: "PUT", body, headers: { "Content-Type": contentType } });
  if (!res.ok) throw new Error(`R2 upload failed (${res.status}).`);
}

const unxml = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");

/** Every object under `prefix` (ListObjectsV2, following continuation tokens). */
export async function listObjects(prefix: string): Promise<{ key: string; size: number; at: string }[]> {
  if (!r2Configured()) return devStorage.list(prefix);
  const out: { key: string; size: number; at: string }[] = [];
  let token = "";
  do {
    const url = new URL(bucketUrl());
    url.searchParams.set("list-type", "2");
    url.searchParams.set("prefix", prefix);
    if (token) url.searchParams.set("continuation-token", token);
    const res = await s3().fetch(url.toString());
    if (!res.ok) throw new Error(`R2 list failed (${res.status}).`);
    const xml = await res.text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const tag = (t: string) => m[1].match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`))?.[1] ?? "";
      out.push({ key: unxml(tag("Key")), size: Number(tag("Size")), at: tag("LastModified") });
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? unxml(xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1] ?? "") : "";
  } while (token);
  return out;
}
