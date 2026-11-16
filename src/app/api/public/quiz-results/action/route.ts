import { z } from "zod";
import { clientIp, overLimit, readForm } from "@/server/guard";
import { HttpError, route } from "@/server/http";
import { findQuizResultByRef, updateQuizResultByRef } from "@/server/leads";

export const dynamic = "force-dynamic";

const schema = z.object({
  ref: z
    .string()
    .min(1)
    .max(24)
    .regex(/^[A-Za-z0-9-]+$/),
  action: z.literal("whatsapp"),
});

export const POST = route(async (req: Request) => {
  if (await overLimit("quiz-action", clientIp(req), 60, 3600)) throw new HttpError(429, "Too many requests — please try again later.");
  const body = await readForm(req, schema);

  const existing = await findQuizResultByRef(body.ref);
  if (existing && existing.action !== "email") await updateQuizResultByRef(body.ref, { action: body.action });

  return new Response(null, { status: 204 });
});
