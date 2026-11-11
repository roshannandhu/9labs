"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Ebook } from "@/content/site";
import { useSite } from "@/components/providers/SiteProvider";
import { BookCover } from "./BookCover";
import { Success } from "./BookDialog";
import { LeadForm, type LeadValues } from "./LeadForm";

/** A book's own page (/ebooks/<name>): the cover, what's inside, and the same request form as the shelf. */
export function BookLanding({ book }: { book: Ebook }) {
  const { ebooksSection: t } = useSite();
  const [lead, setLead] = useState<LeadValues | null>(null);
  const router = useRouter();

  return (
    <div className="container-x grid max-w-[1040px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-14">
      <div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="on-dark relative aspect-[200/290] w-[180px] shrink-0 overflow-hidden rounded-[4px_12px_12px_4px] shadow-[0_30px_60px_-28px_rgb(14_12_32/0.55)] sm:w-[210px]">
            <BookCover book={book} />
          </div>
          <div className="min-w-0">
            <p className="label-mono">{t.label}</p>
            <h1 className="mt-3 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-semibold leading-[1.03] tracking-[-0.035em] text-white">{book.title}</h1>
            {book.subtitle && <p className="mt-3 text-[17px] leading-snug text-nl-ink">{book.subtitle}</p>}
            <div className="mt-4 flex flex-wrap gap-1.5 text-[12.5px] text-white/60">
              {book.pages > 0 && <span className="rounded-full border border-white/12 px-2.5 py-1">{book.pages} pages</span>}
              <span className="rounded-full border border-white/12 px-2.5 py-1">PDF</span>
              {book.readTime && <span className="rounded-full border border-white/12 px-2.5 py-1">{book.readTime}</span>}
            </div>
          </div>
        </div>
        {book.oneLiner && <p className="mt-8 max-w-[56ch] text-[16.5px] leading-relaxed text-nl-ink">{book.oneLiner}</p>}
        {book.chapters.length > 0 && (
          <>
            <h2 className="label-mono mt-9">{t.insideLabel}</h2>
            <ol className="mt-3 max-w-[56ch] space-y-2.5">
              {book.chapters.map((c, i) => (
                <li key={`${c}-${i}`} className="flex items-baseline gap-3 border-b border-white/[0.08] pb-2.5 text-[15px] text-white/85">
                  <span className="text-[11px] font-semibold text-nl-purple">{String(i + 1).padStart(2, "0")}</span>
                  {c}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      <div className="self-start rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,var(--surface-1),var(--surface-2))] p-5 sm:p-7 lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
        {lead ? (
          <Success
            book={book}
            lead={lead}
            onBack={() => router.push("/#ebooks")}
          />
        ) : (
          <LeadForm book={book} onDone={setLead} compact />
        )}
      </div>
    </div>
  );
}
