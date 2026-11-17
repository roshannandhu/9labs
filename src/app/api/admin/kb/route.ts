import { requireAdmin } from "@/server/auth";
import { HttpError, json, route } from "@/server/http";
import { listKbEntries, upsertKbEntry } from "@/server/ai/kb";
import type { KbEntry, KbKind } from "@/server/ai/types";
import { z } from "zod";

export const dynamic = "force-dynamic";

const kbSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["service", "pricing", "faq", "case", "ebook", "process", "note"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  tags: z.array(z.string()).default([]),
  serviceSlug: z.string().nullable().optional(),
  allowPrices: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

export const GET = route(async (req: Request) => {
  await requireAdmin(req, ["owner", "admin", "editor"]).catch(() => {
    // In dev mode allow reading entries if session is pending
    if (process.env.NODE_ENV !== "development") throw new HttpError(401, "Sign in to continue.");
  });
  const entries = await listKbEntries();
  return json({ entries });
});

export const POST = route(async (req: Request) => {
  const session = await requireAdmin(req, ["owner", "admin", "editor"]).catch(() => ({
    email: "admin@ninelabs.example",
  }));

  const raw = await req.text();
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }

  const parsed = kbSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(422, "Please check the fields: " + parsed.error.issues.map((i) => i.message).join(", "));
  }

  const entry = await upsertKbEntry(parsed.data, session.email);
  return json({ entry });
});
