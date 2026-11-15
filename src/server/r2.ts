import "server-only";
import { AwsClient } from "aws4fetch";
import { env } from "./env";

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

/** A time-limited URL the browser can PUT a file straight to, with no server in the middle. */
export async function presignPut(key: string, seconds = 600): Promise<string> {
  const url = new URL(`${bucketUrl()}/${key}`);
  url.searchParams.set("X-Amz-Expires", String(seconds));
  const signed = await s3().sign(url.toString(), { method: "PUT", aws: { signQuery: true } });
  return signed.url;
}

export async function getObject(key: string): Promise<Response> {
  return s3().fetch(`${bucketUrl()}/${key}`);
}
