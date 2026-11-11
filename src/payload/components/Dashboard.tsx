import Link from "next/link";
import type { Payload } from "payload";
import { isAdminUp } from "../access";
import { smtpConfigured } from "../../lib/mail/transport";
import { googleConfigured } from "../../lib/auth/flow";

type Props = { payload: Payload; user?: { name?: string | null; email?: string; role?: string } | null };

async function numbers(payload: Payload) {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const o = { overrideAccess: true } as const;
  const [pending, failed, enquiries, quizWeek, recent, books] = await Promise.all([
    payload.count({ collection: "leads", where: { status: { equals: "pending" } }, ...o }),
    payload.count({ collection: "leads", where: { status: { equals: "failed" } }, ...o }),
    payload.count({ collection: "enquiries", where: { status: { equals: "new" } }, ...o }),
    payload.count({ collection: "quiz-submissions", where: { createdAt: { greater_than: weekAgo } }, ...o }),
    payload.find({ collection: "quiz-submissions", where: { createdAt: { greater_than: monthAgo } }, limit: 1000, depth: 0, select: { top: true }, ...o }),
    payload.find({ collection: "ebooks", limit: 100, depth: 0, ...o }),
  ]);
  const tally = new Map<string, number>();
  for (const d of recent.docs) if (d.top) tally.set(d.top, (tally.get(d.top) ?? 0) + 1);
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    pending: pending.totalDocs,
    failed: failed.totalDocs,
    enquiries: enquiries.totalDocs,
    quizWeek: quizWeek.totalDocs,
    top: top ? `${top[0]} (${top[1]})` : "—",
    downloads: books.docs.reduce((n, b) => n + (b.downloads ?? 0), 0),
    noPdf: books.docs.filter((b) => b.enabled !== false && !b.file).map((b) => b.title),
  };
}

function Card({ href, value, label, tone = "" }: { href: string; value: string | number; label: string; tone?: string }) {
  return (
    <a href={href} className={`nl-dash__card ${tone}`}>
      <span className="nl-dash__value">{value}</span>
      <span className="nl-dash__label">{label}</span>
    </a>
  );
}

/** The first screen after signing in: what needs attention, and shortcuts to the common jobs. */
export async function Dashboard({ payload, user }: Props) {
  const lead = isAdminUp(user);
  const n = lead ? await numbers(payload) : null;
  const first = (user?.name || user?.email || "").split(/[\s@]/)[0];

  return (
    <section className="nl-dash">
      <h1>Welcome{first ? `, ${first}` : ""}</h1>
      <p className="nl-dash__lead">Everything on the website is edited here. Changes appear on the site as soon as you press Save.</p>

      {n && (
        <>
          <div className="nl-dash__grid">
            <Card href="/admin/collections/leads?where[status][equals]=pending" value={n.pending} label="Book requests waiting for approval" tone={n.pending ? "is-hot" : ""} />
            <Card href="/admin/collections/enquiries?where[status][equals]=new" value={n.enquiries} label="New enquiries" tone={n.enquiries ? "is-hot" : ""} />
            <Card href="/admin/collections/quiz-submissions" value={n.quizWeek} label="Quizzes finished in the last 7 days" />
            <Card href="/admin/collections/quiz-submissions" value={n.top} label="Most recommended (30 days)" />
            <Card href="/admin/collections/ebooks" value={n.downloads} label="E-book downloads" />
            {n.failed > 0 && <Card href="/admin/collections/leads?where[status][equals]=failed" value={n.failed} label="E-mails that failed to send" tone="is-bad" />}
          </div>
          {n.noPdf.length > 0 && (
            <p className="nl-dash__warn">
              <strong>No PDF yet:</strong> {n.noPdf.join(", ")}. Requests for {n.noPdf.length === 1 ? "this book" : "these books"} cannot be sent until a PDF is uploaded (Books → the book → Cover &amp; PDF).
            </p>
          )}
        </>
      )}

      {!smtpConfigured() && (
        <p className="nl-dash__warn">
          <strong>No mailbox connected.</strong> E-mails are being saved on the server (data/outbox) instead of sent. Add the mailbox’s SMTP details to the server settings to send for real.
        </p>
      )}
      {!googleConfigured() && (
        <p className="nl-dash__warn">
          <strong>Google sign-in is not set up yet.</strong> Add the Google client ID and secret to the server settings before going live.
        </p>
      )}

      <h2>Shortcuts</h2>
      <div className="nl-dash__links">
        <Link href="/admin/globals/homepage">Edit the homepage</Link>
        <Link href="/admin/globals/company">Company &amp; contact details</Link>
        <Link href="/admin/collections/services">The 9 cards</Link>
        <Link href="/admin/collections/ebooks/create">Add a book</Link>
        <Link href="/admin/globals/quiz-settings">Quiz questions</Link>
        <Link href="/admin/collections/faqs">FAQ</Link>
        <Link href="/admin/collections/pages">Pages (About, Privacy…)</Link>
        <a href={process.env.NEXT_PUBLIC_SITE_URL || "/"} target="_blank" rel="noopener noreferrer">
          View the website ↗
        </a>
      </div>
    </section>
  );
}
