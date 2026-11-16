import "server-only";
import { z } from "zod";

/**
 * Only SITE_URL, the Supabase pair, APP_SECRET and CRON_SECRET are required — nothing works
 * without them. R2 and SMTP are optional: before they're configured, uploads simply aren't
 * available yet and mail is logged instead of sent (see `src/server/mail.ts`).
 */
const schema = z.object({
  SITE_URL: z.string().min(1),
  SUPABASE_URL: z.string().min(1),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  APP_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(16),
  ADMIN_EMAILS: z.string().optional().default(""),
  R2_ACCOUNT_ID: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default(""),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
  R2_BUCKET: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().optional().default(465),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  MAIL_FROM: z.string().optional().default(""),
  MAIL_FROM_NAME: z.string().optional().default("Nine Labs Solutions"),
  ALLOW_SAMPLE_SEED: z.string().optional().default(""),
});

type Env = z.infer<typeof schema>;
let cached: Env | undefined;

/** Parses `process.env` on first call (never at module load), so a build never needs secrets. */
export function env(): Env {
  if (!cached) {
    cached = schema.parse({
      SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
      APP_SECRET: process.env.APP_SECRET,
      CRON_SECRET: process.env.CRON_SECRET,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS,
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: process.env.R2_BUCKET,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      MAIL_FROM: process.env.MAIL_FROM,
      MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
      ALLOW_SAMPLE_SEED: process.env.ALLOW_SAMPLE_SEED,
    });
  }
  return cached;
}

export const adminEmails = (): string[] =>
  env()
    .ADMIN_EMAILS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const r2Configured = (): boolean => Boolean(env().R2_ACCOUNT_ID && env().R2_ACCESS_KEY_ID && env().R2_SECRET_ACCESS_KEY && env().R2_BUCKET);
export const smtpConfigured = (): boolean => Boolean(env().SMTP_HOST);
export const sampleSeedAllowed = (): boolean => env().ALLOW_SAMPLE_SEED === "1";
