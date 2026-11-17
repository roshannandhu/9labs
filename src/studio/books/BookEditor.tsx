"use client";

import { useState } from "react";
import Link from "next/link";
import type { Ebook } from "@/content/site";
import { BookCover } from "@/components/ebooks/BookCover";
import { siteHref } from "@/lib/site-href";
import { checkpoint, setDraft } from "@/studio/store";
import type { Path } from "@/lib/path";
import { AreaField, CheckField, ImageField, ListField, NumField, PdfField, TextField } from "../Field";
import { Panel, Segmented, Button, useConfirm, useToast } from "../ui";
import { useBookRequests, useField, usePublished } from "../state";
import { useFileUrl } from "../useFileUrl";

/**
 * A cover drawn as a book, like the website's shelf: it rests turned toward you (with a page edge
 * showing) and straightens up on hover. The book list card and the editor's preview both use it.
 */
export function TiltCover({ book, className = "" }: { book: Ebook; className?: string }) {
  const { url: coverUrl } = useFileUrl(book.cover);
  const { url: logoUrl } = useFileUrl(book.coverLogo);
  const resolved: Ebook = { ...book, cover: coverUrl, coverLogo: logoUrl };
  return (
    <div className={`group [perspective:900px] ${className}`}>
      <div className="relative aspect-[200/290] transition-transform duration-500 ease-out will-change-transform [transform:rotateY(-18deg)_rotateX(4deg)] group-hover:[transform:rotateY(-4deg)_rotateX(1deg)_translateZ(12px)]">
        {/* the pages, seen past the cover's right edge */}
        <span className="absolute -right-[5px] bottom-[3px] top-[3px] w-[7px] rounded-r-[3px] bg-[repeating-linear-gradient(90deg,#d9d6cf_0_1px,#b8b3aa_1px_2px)] shadow-[inset_0_0_6px_rgb(0_0_0/0.35)]" aria-hidden="true" />
        <div className="relative h-full overflow-hidden rounded-[3px_6px_6px_3px] shadow-[10px_14px_28px_-10px_rgb(0_0_0/0.6)]">
          <BookCover book={resolved} />
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,.09)_48%,transparent_60%)]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/** A book's link name from its title. */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80);

/** `base`, or `base-2`, `base-3`… — whichever no other book uses. */
export function uniqueSlug(base: string, taken: Set<string>) {
  let slug = base || "book";
  for (let n = 2; taken.has(slug); n++) slug = `${base || "book"}-${n}`;
  return slug;
}

const SWATCHES: { value: Ebook["tone"]; label: string; style: React.CSSProperties }[] = [
  { value: "blue", label: "Blue", style: { background: "linear-gradient(160deg,#1c2142,#090a12)" } },
  { value: "purple", label: "Purple", style: { background: "linear-gradient(160deg,#2a1c42,#090a12)" } },
  { value: "duo", label: "Blue → Purple", style: { background: "linear-gradient(160deg,#5a48f5,#6f55e8)" } },
];

/** The books editor's content — rendered inside the page's wide drawer. */
export function BookEditor({ index, onDelete }: { index: number; onDelete: () => void }) {
  const [book] = useField<Ebook>(["site", "ebooks", index]);
  const [books] = useField<Ebook[]>(["site", "ebooks"]);
  const published = usePublished();
  const [coverMode, setCoverMode] = useState<"designed" | "own">(book?.cover ? "own" : "designed");
  const confirm = useConfirm();
  const toast = useToast();
  const bookRequests = useBookRequests();

  // `book` is briefly undefined while this drawer animates closed after its own delete (the array has
  // already shrunk below `index`, but this instance hasn't unmounted yet).
  if (!book) return null;

  /** Requests/downloads come from the leads themselves now, not a denormalized counter on the book. */
  const requests = bookRequests.filter((r) => r.bookSlug === book.slug);
  const downloads = requests.reduce((s, r) => s + r.downloads, 0);

  const path = (...rest: (string | number)[]): Path => ["site", "ebooks", index, ...rest];
  // the link name follows the title until someone edits it by hand
  const titleSlug = slugify(book.title) || "book";
  const autoSlug = !book.slug || book.slug === titleSlug || new RegExp(`^${titleSlug}-\\d+$`).test(book.slug);
  const followTitle = (title: string) => {
    if (!autoSlug) return;
    const taken = new Set((books ?? []).filter((b) => b.id !== book.id).map((b) => b.slug));
    setDraft(path("slug"), uniqueSlug(slugify(title), taken));
  };
  const liveOnSite = published.site.ebooks.some((b) => b.id === book.id && b.enabled && b.slug === book.slug);

  const switchToDesigned = async () => {
    if (book.cover) {
      const ok = await confirm({ title: "Remove your own image?", body: "This switches back to a designed cover and clears the uploaded image." });
      if (!ok) return;
    }
    checkpoint();
    setDraft(path("cover"), "");
    setCoverMode("designed");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[200px_1fr] lg:items-start">
      <div className="lg:sticky lg:top-0">
        <TiltCover book={book} className="mx-auto w-[160px] lg:w-full" />
        <p className="mt-2.5 text-center text-[11.5px] text-st-dim">{book.cover ? "Your own image" : "Designed cover"}</p>
        {liveOnSite ? (
          <a href={siteHref(`/ebooks/${book.slug}/`)} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center justify-center gap-1 text-[12px] font-medium text-st-purple hover:underline">
            Open on website ↗
          </a>
        ) : (
          <p className="mt-1 text-center text-[11.5px] text-st-dim">{book.enabled ? "On the website after you publish" : "Hidden from the website"}</p>
        )}
      </div>

      <div className="grid gap-4">
        <Panel label="Visibility">
          <CheckField path={path("enabled")} label="Show on the website" />
          <TextField path={path("slug")} label="Link name" placeholder="the-foundations" mono help="Used in the book's address: /ebooks/…. Lowercase letters, numbers and dashes." />
          {!book.slug.trim() && <p className="text-[12.5px] text-st-danger">Add a link name, or this book won&apos;t have its own page.</p>}
        </Panel>

        <Panel label="Details">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextField path={path("title")} label="Title" onValue={followTitle} />
            <TextField path={path("subtitle")} label="Subtitle" />
          </div>
          <AreaField path={path("oneLiner")} label="One-line description" rows={2} />
          <ListField path={path("chapters")} label="Chapters" help="Type one and press Enter." />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <NumField path={path("pages")} label="Pages" min={1} />
            <TextField path={path("readTime")} label="Reading time" placeholder="35 min read" />
          </div>
        </Panel>

        <Panel label="Cover">
          <Segmented
            layoutId={`cover-${book.id}`}
            value={coverMode}
            onChange={(v) => {
              if (v === "designed") void switchToDesigned();
              else setCoverMode(v);
            }}
            options={[
              { value: "designed", label: "Designed" },
              { value: "own", label: "Own image" },
            ]}
          />
          {coverMode === "designed" ? (
            <>
              <div>
                <span className="st-label">Colour</span>
                <div className="mt-1.5 grid grid-cols-3 gap-2.5">
                  {SWATCHES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        checkpoint();
                        setDraft(path("tone"), s.value);
                      }}
                      aria-label={s.label}
                      aria-pressed={book.tone === s.value}
                      className={`h-14 rounded-xl border-2 transition-colors ${book.tone === s.value ? "border-st-purple" : "border-transparent"}`}
                      style={s.style}
                    />
                  ))}
                </div>
              </div>
              <ImageField path={path("coverLogo")} label="Logo on the cover" help="A light or white logo with a transparent background — the cover is dark." keepFormat />
            </>
          ) : (
            <ImageField path={path("cover")} label="Your own cover image" help="Portrait, about 2:3 — e.g. 1000 × 1450 px." />
          )}
        </Panel>

        <Panel label="The e-book (PDF)">
          <PdfField idPath={path("pdfFileId")} namePath={path("pdfName")} sizePath={path("pdfSize")} label="PDF file" />
        </Panel>

        <Panel label="Requests">
          <p className="text-[13px] text-st-sub">
            {requests.length} request{requests.length === 1 ? "" : "s"} · {downloads} download{downloads === 1 ? "" : "s"} — see them in the{" "}
            <Link href="/admin/inbox?tab=books" className="font-medium text-st-purple hover:underline">
              Inbox →
            </Link>
          </p>
          <p className="st-help">Every request is sent the PDF automatically, as soon as it has one.</p>
        </Panel>

        <Panel label="Danger zone">
          <Button
            variant="danger"
            onClick={async () => {
              const ok = await confirm({ title: `Delete “${book.title}”?`, body: "This can't be undone.", confirmLabel: "Delete", danger: true });
              if (!ok) return;
              onDelete();
              toast("ok", "Deleted.");
            }}
          >
            Delete this book
          </Button>
        </Panel>
      </div>
    </div>
  );
}
