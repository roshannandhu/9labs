import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { json, overLimit, readForm } from "@/lib/forms/guard";
import { getSite } from "@/lib/content/getSite";

const short = z.string().trim().max(120);
const schema = z.object({
  service: z.string().max(120),
  needs: z.array(short).max(20).optional().default([]),
  budget: short.optional().default(""),
  timeline: short.optional().default(""),
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().max(800).optional().default(""),
  channel: z.enum(["whatsapp", "email"]).optional().default("whatsapp"),
});

/** Saves a Talk-to-us enquiry for the admin (The 9 cards → Enquiries) just before WhatsApp opens. */
export async function POST(req: Request) {
  const form = await readForm(req, schema);
  if (form.error) return form.error;
  const d = form.data;
  const payload = await getPayload({ config });
  if (await overLimit(payload, req, "enquiry", 10, 600)) return json({ ok: false }, 429);

  const site = await getSite();
  const svc = site.services.find((s) => s.slug === d.service);
  await payload.create({
    collection: "enquiries",
    overrideAccess: true,
    data: { name: d.name, company: d.company, service: svc?.title ?? d.service, needs: d.needs, budget: d.budget, timeline: d.timeline, message: d.message, channel: d.channel, status: "new" },
  });
  return json({ ok: true });
}
