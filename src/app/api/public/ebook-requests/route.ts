import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { json, looksAutomated, overLimit, readForm } from "@/lib/forms/guard";
import { alertAdmin, approvalFor, deliverLead, deliverySettings } from "@/lib/ebooks/send";

const schema = z.object({
  book: z.string().min(1).max(120),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().max(200).regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
  code: z.string().max(8).regex(/^\+?\d{0,6}$/).optional().default(""),
  phone: z.string().max(24).optional().default(""),
  company: z.string().trim().max(160).optional().default(""),
  consent: z.literal(true),
  website: z.string().max(200).optional(),
  elapsed: z.number().optional(),
  source: z.string().max(200).optional().default(""),
});

/**
 * The e-book request form. Saves the request for the admin (Books → Book requests). With
 * automatic sending the book is e-mailed straight away; otherwise the admin is alerted and the
 * request waits for "Approve & send".
 */
export async function POST(req: Request) {
  const form = await readForm(req, schema);
  if (form.error) return form.error;
  const d = form.data;
  // a robot gets a polite "thank you" and nothing is saved or sent
  if (looksAutomated(d.website, d.elapsed)) return json({ status: "pending" });

  const payload = await getPayload({ config });
  if (await overLimit(payload, req, "ebook", 6, 600)) return json({ error: "Too many requests from this connection. Please try again in a few minutes." }, 429);

  const found = await payload.find({ collection: "ebooks", where: { and: [{ slug: { equals: d.book } }, { enabled: { not_equals: false } }] }, limit: 1, depth: 0, overrideAccess: true });
  const book = found.docs[0];
  if (!book) return json({ error: "This e-book is no longer available." }, 404);

  const digits = d.phone.replace(/\D/g, "");
  const settings = await payload.findGlobal({ slug: "ebook-settings", depth: 0, overrideAccess: true });
  if (settings.form?.phoneRequired !== false || digits) {
    if (digits.length < 7 || digits.length > 14) return json({ error: "Please enter a valid phone number." }, 422);
  }
  const phone = digits ? `${d.code} ${d.phone.trim()}`.trim() : "";

  // the same person asking for the same book again within a day: one request, not two
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const again = await payload.find({
    collection: "leads",
    where: { and: [{ email: { equals: d.email } }, { book: { equals: book.id } }, { createdAt: { greater_than: dayAgo } }, { status: { not_equals: "rejected" } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (again.docs[0]) {
    const lead = again.docs[0];
    await payload.update({ collection: "leads", id: lead.id, data: { name: d.name, phone: phone || lead.phone, company: d.company || lead.company }, overrideAccess: true });
    return json({ status: lead.status === "sent" ? "sent" : "pending" });
  }

  const lead = await payload.create({
    collection: "leads",
    overrideAccess: true,
    data: { name: d.name, email: d.email, phone, company: d.company, book: book.id, consent: true, source: d.source, status: "pending" },
  });
  await payload.update({ collection: "ebooks", id: book.id, data: { requests: (book.requests ?? 0) + 1 }, overrideAccess: true });

  const { delivery } = await deliverySettings(payload);
  if (approvalFor(book, delivery) === "auto") {
    const sent = await deliverLead(payload, lead.id);
    // if automatic sending fails (no PDF yet, mailbox down) the request simply waits for the admin
    await alertAdmin(payload, lead, book.title, !sent.ok);
    return json({ status: sent.ok ? "sent" : "pending" });
  }
  await alertAdmin(payload, lead, book.title, true);
  return json({ status: "pending" });
}
