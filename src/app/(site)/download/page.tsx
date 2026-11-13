"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSite, useWhatsApp } from "@/components/providers/SiteProvider";
import { PageHeader, PageShell } from "@/components/pages/PageShell";
import { checkDownloadLink, recordDownload, type LinkState } from "@/lib/ebooks/deliver";
import { fileUrl } from "@/lib/files";

const PROBLEMS: Record<Exclude<LinkState, { ok: true }>["reason"], { title: string; text: string }> = {
  invalid: { title: "This link is not valid.", text: "It may have been replaced by a newer e-mail from us. Please use the link in the latest e-mail." },
  expired: { title: "This link has expired.", text: "Download links work for a limited time. Ask for the book again and we will send a fresh link." },
  used: { title: "This link has been used up.", text: "Each link allows a limited number of downloads. Ask for the book again and we will send a fresh link." },
  missing: { title: "This book is not available right now.", text: "Please message us and we will send it to you." },
};

function DownloadInner() {
  const token = useSearchParams().get("t") ?? "";
  const site = useSite();
  const wa = useWhatsApp();
  const [state, setState] = useState<LinkState | null>(null);
  const [fileHref, setFileHref] = useState<string>();

  useEffect(() => {
    const link = checkDownloadLink(token);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the token can only be checked against the browser's own store, after mount
    setState(link);
    if (link.ok) void fileUrl(link.book.pdfFileId!).then(setFileHref);
  }, [token]);

  if (!state) return null;

  if (!state.ok) {
    const p = PROBLEMS[state.reason];
    return (
      <PageShell>
        <PageHeader eyebrow={site.ebooksSection.label} title={p.title} intro={p.text} />
        <div className="container-x mt-8 flex max-w-[920px] flex-wrap gap-3">
          <Link href="/#ebooks" className="btn btn-primary">
            {site.ebooksSection.cardCta}
          </Link>
          <a href={wa()} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            {site.contact.chatLabel}
          </a>
        </div>
      </PageShell>
    );
  }

  const { book, request, left } = state;
  const until = request.expiresAt ? new Date(request.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  return (
    <PageShell>
      <PageHeader eyebrow={site.ebooksSection.label} title={book.title} intro={book.subtitle || book.oneLiner} />
      <div className="container-x mt-8 max-w-[920px]">
        <a href={fileHref} download={`${book.slug || "e-book"}.pdf`} className="btn btn-primary" onClick={() => recordDownload(request.id)}>
          Download the e-book (PDF)
        </a>
        <p className="mt-4 text-[13.5px] text-nl-ink">
          This is your personal link{until ? ` — it works until ${until}` : ""}. {left} {left === 1 ? "download" : "downloads"} left.
        </p>
      </div>
    </PageShell>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={null}>
      <DownloadInner />
    </Suspense>
  );
}
