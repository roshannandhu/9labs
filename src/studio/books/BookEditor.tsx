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
import { useBookRequests, useField } from "../state";
import { useFileUrl } from "../useFileUrl";

/** A cover with a perspective hover tilt and a spine-ish shadow — the book list card and the editor's preview both use it. */
export function TiltCover({ book, className = "" }: { book: Ebook; className?: string }) {
  const { url: coverUrl } = useFileUrl(book.cover);
  const { url: logoUrl } = useFileUrl(book.coverLogo);
  const resolved: Ebook = { ...book, cover: coverUrl, coverLogo: logoUrl };
  return (
    <div className={`group [perspective:900px] ${className}`}>
      <div className="aspect-[200/290] overflow-hidden rounded-[6px] shadow-[4px_10px_24px_-8px_rgb(0_0_0/0.5)] transition-transform duration-300 ease-out will-change-transform group-hover:[transform:rotateY(-14deg)_rotateX(3deg)]">
        <BookCover book={resolved} />
      </div>
    </div>
  );
}

const SWATCHES: { value: Ebook["tone"]; label: string; style: React.CSSProperties }[] = [
  { value: "blue", label: "Blue", style: { background: "linear-gradient(160deg,#1c2142,#090a12)" } },
  { value: "purple", label: "Purple", style: { background: "linear-gradient(160deg,#2a1c42,#090a12)" } },
  { value: "duo", label: "Blue → Purple", style: { background: "linear-gradient(160deg,#5a48f5,#6f55e8)" } },
];

/** The books editor's content — rendered inside the page's wide drawer. */
export function BookEditor({ index, onDelete }: { index: number; onDelete: () => void }) {
  const [book] = useField<Ebook>(["site", "ebooks", index]);
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
        {book.slug.trim() && (
          <a href={siteHref(`/ebooks/${book.slug}/`)} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center justify-center gap-1 text-[12px] font-medium text-st-purple hover:underline">
            Open on website ↗
          </a>
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
            <TextField path={path("title")} label="Title" />
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
