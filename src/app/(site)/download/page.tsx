"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSite, useWhatsApp } from "@/components/providers/SiteProvider";
import { PageHeader, PageShell } from "@/components/pages/PageShell";

type LinkState = { ok: true; book: { title: string; subtitle: string; oneLiner: string; slug: string }; expiresAt: string | null; left: number } | { ok: false; reason: "invalid" | "expired" | "used" | "missing" };

const PROBLEMS: Record<Exclude<LinkState, { ok: true }>["reason"], { title: string; text: string }> = {
  invalid: { title: "This link is not valid.", text: "It may have been replaced by a newer e-mail from us. Please use the link in the latest e-mail." },
  expired: { title: "This link has expired.", text: "Download links work for a limited time. Ask for the book again and we will send a fresh link." },
  used: { title: "This link has been used up.", text: "Each link allows a limited number of downloads. Ask for the book again and we will send a fresh link." },
  missing: { title: "This book is not available right now.", text: "Please message us and we will send it to you." },
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function DownloadInner() {
  const token = useSearchParams().get("t") ?? "";
  const site = useSite();
  const wa = useWhatsApp();
  const [state, setState] = useState<LinkState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${basePath}/api/public/download/?t=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: LinkState) => {
        if (!cancelled) setState(data);
      })
      .catch(() => {
        if (!cancelled) setState({ ok: false, reason: "invalid" });
      });
    return () => {
      cancelled = true;
    };
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

  const { book, expiresAt, left } = state;
  const until = expiresAt ? new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <PageShell>
      <PageHeader eyebrow={site.ebooksSection.label} title={book.title} intro={book.subtitle || book.oneLiner} />
      <div className="container-x mt-8 max-w-[920px]">
        <form method="post" action={`${basePath}/api/public/download/`} onSubmit={() => setState({ ...state, left: left - 1 })}>
          <input type="hidden" name="t" value={token} />
          <button type="submit" className="btn btn-primary">
            Download the e-book (PDF)
          </button>
        </form>
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
