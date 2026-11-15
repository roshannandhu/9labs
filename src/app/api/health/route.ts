import { db } from "@/server/db";
import { adminEmails, env, r2Configured, smtpConfigured } from "@/server/env";
import { HttpError, json, route } from "@/server/http";
import { sendMail } from "@/server/mail";
import { getObject } from "@/server/r2";

export const dynamic = "force-dynamic";

/**
 * Booleans only, never values — this proves the platform works (Phase 1) and later stays as an
 * at-a-glance check. `Bearer <CRON_SECRET>` gates it, the same secret the scheduled retry uses.
 */
export const GET = route(async (req: Request) => {
  if (req.headers.get("authorization") !== `Bearer ${env().CRON_SECRET}`) throw new HttpError(401, "Not authorized.");

  const envOk = {
    supabase: Boolean(env().SUPABASE_URL && env().SUPABASE_PUBLISHABLE_KEY && env().SUPABASE_SECRET_KEY),
    appSecret: Boolean(env().APP_SECRET),
    cronSecret: Boolean(env().CRON_SECRET),
    adminEmails: adminEmails().length > 0,
    r2: r2Configured(),
    smtp: smtpConfigured(),
  };

  let dbOk = false;
  try {
    const { error } = await db().auth.admin.listUsers({ page: 1, perPage: 1 });
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  let r2Ok = false;
  if (r2Configured()) {
    try {
      const res = await getObject("health");
      r2Ok = res.status === 200 || res.status === 404;
    } catch {
      r2Ok = false;
    }
  }

  const body: Record<string, unknown> = { env: envOk, db: dbOk, r2: r2Ok };

  if (new URL(req.url).searchParams.get("mail") === "1") {
    const to = adminEmails()[0];
    if (!to) {
      body.mail = { attempted: false, ok: false };
    } else {
      const result = await sendMail({ kind: "health-check", to, subject: "Nine Labs — test e-mail", html: "<p>This is a test e-mail from /api/health.</p>", text: "This is a test e-mail from /api/health." });
      body.mail = { attempted: true, ok: result.ok, logged: !smtpConfigured() };
    }
  }

  return json(body);
});
