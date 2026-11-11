import type { Metadata } from "next";
import Link from "next/link";
import { checkLink } from "@/lib/ebooks/send";
import { getSite, payloadClient } from "@/lib/content/getSite";
import { PageHeader, PageShell } from "@/components/pages/PageShell";
import { waLink } from "@/content/site";

export const metadata: Metadata = { title: "Your e-book", robots: { index: false, follow: false } };

const PROBLEMS = {
  invalid: { title: "This link is not valid.", text: "It may have been replaced by a newer e-mail from us. Please use the link in the latest e-mail." },
  expired: { title: "This link has expired.", text: "Download links work for a limited time. Ask for the book again and we will send a fresh link." },
  used: { title: "This link has been used up.", text: "Each link allows a limited number of downloads. Ask for the book again and we will send a fresh link." },
  missing: { title: "This book is not available right now.", text: "Please message us and we will send it to you." },
};

/**
 * Where the e-mail's download button lands. The page only checks the link and shows a button;
 * the download is counted when the button is pressed, so a mail scanner opening the link does
 * not use it up.
 */
export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [link, site] = await Promise.all([checkLink(await payloadClient(), token), getSite()]);

  if (!link.ok) {
    const p = PROBLEMS[link.reason];
    return (
      <PageShell>
        <PageHeader eyebrow={site.ebooksSection.label} title={p.title} intro={p.text} />
        <div className="container-x mt-8 flex max-w-[920px] flex-wrap gap-3">
          <Link href="/#ebooks" className="btn btn-primary">
            {site.ebooksSection.cardCta}
          </Link>
          <a href={waLink(site.contact.whatsappNumber, site.contact.whatsappText)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            {site.contact.chatLabel}
          </a>
        </div>
      </PageShell>
    );
  }

  const { book, lead, left } = link;
  const until = lead.expiresAt ? new Date(lead.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  return (
    <PageShell>
      <PageHeader eyebrow={site.ebooksSection.label} title={book.title} intro={book.subtitle || book.oneLiner} />
      <div className="container-x mt-8 max-w-[920px]">
        <a href={`/api/download/${token}`} className="btn btn-primary" download>
          Download the e-book (PDF)
        </a>
        <p className="mt-4 text-[13.5px] text-nl-ink">
          This is your personal link{until ? ` — it works until ${until}` : ""}. {left} {left === 1 ? "download" : "downloads"} left.
        </p>
      </div>
    </PageShell>
  );
}
