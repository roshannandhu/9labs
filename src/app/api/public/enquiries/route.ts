import { z } from "zod";
import { enquiryMissingFields, enquiryNameOk, type EnquiryAnswers } from "@/lib/enquiry";
import { getPublished } from "@/server/content";
import { clientIp, overLimit, readForm } from "@/server/guard";
import { HttpError, json, route } from "@/server/http";
import { insertEnquiry } from "@/server/leads";

export const dynamic = "force-dynamic";

const schema = z.object({
  ref: z
    .string()
    .max(24)
    .regex(/^[A-Za-z0-9-]*$/),
  service: z.string().min(1).max(80),
  channel: z.enum(["whatsapp", "email"]),
  answers: z.object({
    name: z.string().min(1).max(80),
    company: z.string().max(120).default(""),
    needs: z.array(z.string().max(80)).max(12).default([]),
    budget: z.string().max(80).default(""),
    timeline: z.string().max(80).default(""),
    message: z.string().max(2000).default(""),
  }),
});

/** The visitor's own WhatsApp message or e-mail already reaches the owner — this only saves a copy for the Inbox. */
export const POST = route(async (req: Request) => {
  if (await overLimit("enquiries", clientIp(req), 10, 3600)) throw new HttpError(429, "Too many requests — please try again later.");
  const body = await readForm(req, schema);

  const published = await getPublished();
  const svc = published.site.services.find((s) => s.slug === body.service);
  if (!svc) throw new HttpError(422, "That service isn't available.");

  const missing: string[] = [];
  if (!enquiryNameOk(body.answers)) missing.push("name");
  missing.push(...enquiryMissingFields(published.site, body.answers as EnquiryAnswers));
  if (missing.length) throw new HttpError(422, "Please fill in everything marked.", { missing });

  await insertEnquiry({ ref: body.ref, name: body.answers.name.trim(), company: body.answers.company.trim(), service: svc.slug, serviceTitle: svc.title, needs: body.answers.needs, budget: body.answers.budget, timeline: body.answers.timeline, message: body.answers.message.trim(), channel: body.channel });
  return json({ ok: true });
});
