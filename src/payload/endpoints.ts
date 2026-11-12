import type { Endpoint, PayloadRequest } from "payload";
import { isAdminUp } from "./access";
import { buildEbookMail, deliverLead, siteUrl } from "../lib/ebooks/send";
import { sendMail } from "../lib/mail/send";
import { csv, csvResponse } from "../lib/forms/guard";

/**
 * Admin-only actions behind the buttons in the admin panel. Every one checks that the request
 * comes from a signed-in owner or admin; the session cookie is never honoured on a request made
 * by another site (see src/lib/auth/strategy.ts).
 */
const allowed = (req: PayloadRequest) => isAdminUp(req.user);
const denied = () => Response.json({ error: "You do not have access to this." }, { status: 403 });
const idOf = (req: PayloadRequest) => String(req.routeParams?.id ?? "");
const date = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 16).replace("T", " ") : "");

export const adminEndpoints: Endpoint[] = [
  {
    // Approve & send / Resend: e-mail the book (attachment, link or both — the book's or the general setting)
    path: "/nl/leads/:id/send",
    method: "post",
    handler: async (req) => {
      if (!allowed(req)) return denied();
      const res = await deliverLead(req.payload, idOf(req));
      return res.ok ? Response.json({ message: `Sent. ${res.used}.` }) : Response.json({ error: res.error }, { status: 400 });
    },
  },
  {
    path: "/nl/leads/:id/reject",
    method: "post",
    handler: async (req) => {
      if (!allowed(req)) return denied();
      await req.payload.update({ collection: "leads", id: idOf(req), data: { status: "rejected", error: null }, overrideAccess: true });
      return Response.json({ message: "Rejected. Nothing was sent." });
    },
  },
  {
    // Approve everything that is waiting, in one go
    path: "/nl/leads-send-pending",
    method: "post",
    handler: async (req) => {
      if (!allowed(req)) return denied();
      const waiting = await req.payload.find({ collection: "leads", where: { status: { equals: "pending" } }, limit: 200, depth: 0, overrideAccess: true });
      let sent = 0;
      const problems = new Set<string>();
      for (const lead of waiting.docs) {
        const res = await deliverLead(req.payload, lead.id);
        if (res.ok) sent += 1;
        else problems.add(res.error);
      }
      const failed = waiting.docs.length - sent;
      return Response.json({ message: `${sent} sent${failed ? `, ${failed} could not be sent: ${[...problems].join(" ")}` : ""}.`, sent, failed });
    },
  },
  {
    path: "/nl/test-email",
    method: "post",
    handler: async (req) => {
      if (!allowed(req)) return denied();
      const to = (req.user as { email?: string } | null)?.email;
      if (!to) return Response.json({ error: "Your account has no e-mail address." }, { status: 400 });
      try {
        const mail = await buildEbookMail(req.payload, { name: "Alex Sample", bookTitle: "Sample e-book", link: `${siteUrl()}/download/sample-link`, expires: new Date(Date.now() + 7 * 86_400_000) });
        await sendMail(req.payload, { to, subject: `[Test] ${mail.subject}`, html: mail.html, text: mail.text, fromName: mail.delivery.senderName, replyTo: mail.delivery.replyTo || undefined });
        return Response.json({ message: `Test e-mail sent to ${to}. It uses the saved settings — save first if you just changed something.` });
      } catch (err) {
        return Response.json({ error: `The test e-mail could not be sent: ${err instanceof Error ? err.message : "unknown error"}` }, { status: 502 });
      }
    },
  },
  {
    path: "/nl/export/:id",
    method: "get",
    handler: async (req) => {
      if (!allowed(req)) return denied();
      const what = idOf(req);
      const p = req.payload;
      const all = { limit: 5000, sort: "-createdAt", overrideAccess: true } as const;
      if (what === "leads") {
        const r = await p.find({ collection: "leads", depth: 1, ...all });
        return csvResponse(
          "book-requests",
          csv(
            ["Date", "Name", "E-mail", "Phone", "Company", "Book", "Status", "Sent as", "Sent on", "Downloads", "Agreed to e-mails", "Notes"],
            r.docs.map((d) => [date(d.createdAt), d.name, d.email, d.phone, d.company, typeof d.book === "object" ? d.book.title : d.book, d.status, d.deliveryUsed, date(d.sentAt), d.downloads ?? 0, d.consent ? "yes" : "no", d.notes]),
          ),
        );
      }
      if (what === "enquiries") {
        const r = await p.find({ collection: "enquiries", depth: 0, ...all });
        return csvResponse(
          "enquiries",
          csv(
            ["Date", "Name", "Company", "Activity", "Needs", "Budget", "Timeline", "Message", "Sent by", "Follow-up", "Notes"],
            r.docs.map((d) => [date(d.createdAt), d.name, d.company, d.service, d.needs, d.budget, d.timeline, d.message, d.channel, d.status, d.notes]),
          ),
        );
      }
      if (what === "quiz") {
        const r = await p.find({ collection: "quiz-submissions", depth: 0, ...all });
        return csvResponse(
          "quiz-results",
          csv(
            ["Date", "Top recommendation", "Recommended", "Answers", "Next step", "E-mail", "Follow-up", "Notes"],
            r.docs.map((d) => [date(d.createdAt), d.top, d.matches, d.summary, d.action, d.email, d.status, d.notes]),
          ),
        );
      }
      return Response.json({ error: "Unknown export." }, { status: 404 });
    },
  },
];
