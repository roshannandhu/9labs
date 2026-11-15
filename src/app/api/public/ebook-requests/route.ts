import { z } from "zod";
import { getPublished } from "@/server/content";
import { alertAdminNewRequest, deliverBookRequest } from "@/server/ebooks";
import { clientIp, looksAutomated, overLimit, readForm } from "@/server/guard";
import { HttpError, json, route } from "@/server/http";
import { findRecentBookRequest, insertBookRequest, updateBookRequest } from "@/server/leads";

export const dynamic = "force-dynamic";

const schema = z.object({
  bookSlug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  email: z.string().email().max(254),
  code: z.string().max(10).default(""),
  phone: z.string().max(24).default(""),
  company: z.string().max(120).default(""),
  consent: z.boolean(),
  trap: z.string().max(200).default(""),
  elapsedMs: z.number().default(0),
  source: z.string().max(200).default(""),
});

export const POST = route(async (req: Request) => {
  if (await overLimit("ebook-requests", clientIp(req), 6, 3600)) throw new HttpError(429, "Too many requests — please try again later.");
  const body = await readForm(req, schema);

  if (looksAutomated(body.trap, body.elapsedMs)) return json({ status: "pending" });

  const published = await getPublished();
  const book = published.site.ebooks.find((b) => b.slug === body.bookSlug && b.enabled);
  if (!book) return json({ status: "error", error: "This e-book is no longer available." });

  const digits = body.phone.replace(/\D/g, "");
  if (published.site.ebookForm.phoneRequired || digits) {
    if (digits.length < 7 || digits.length > 14) return json({ status: "error", error: "Please enter a valid phone number." });
  }
  const phone = digits ? `${body.code} ${body.phone.trim()}`.trim() : "";

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const again = await findRecentBookRequest(body.email, book.slug, dayAgo);
  if (again) {
    await updateBookRequest(again.id, { name: body.name, phone: phone || again.phone, company: body.company || again.company });
    return json({ status: again.status === "sent" ? "sent" : "pending" });
  }

  const request = await insertBookRequest({ name: body.name, email: body.email, phone, company: body.company, bookSlug: book.slug, source: body.source, consent: body.consent });

  const sent = await deliverBookRequest(request.id);
  await alertAdminNewRequest(request, book.title, !sent.ok);
  return json({ status: sent.ok ? "sent" : "pending" });
});
