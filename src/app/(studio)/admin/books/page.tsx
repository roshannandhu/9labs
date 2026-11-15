"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Ebook } from "@/content/site";
import { setDraft } from "@/lib/store";
import { BookEditor, TiltCover, slugify, uniqueSlug } from "@/studio/books/BookEditor";
import { Icon } from "@/studio/Icon";
import { useFieldArray } from "@/studio/state";
import { Badge, Button, Drawer, PageHeader, Switch } from "@/studio/ui";

function StatTileSmall({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="st-panel p-3.5">
      <p className={`font-digits text-[20px] font-black ${warn ? "text-st-warn" : "text-st-ink"}`}>{value}</p>
      <p className="st-micro mt-0.5">{label}</p>
    </div>
  );
}

function BooksInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { items: books, add, remove } = useFieldArray<Ebook>(["site", "ebooks"]);
  const [openId, setOpenId] = useState<string | null>(null);

  const createBook = () => {
    const title = "New book";
    const slug = uniqueSlug(slugify(title), new Set(books.map((b) => b.slug)));
    const id = `book_${Date.now().toString(36)}`;
    // the next number after the highest one in use (counting would repeat a number after a delete)
    const n = String(books.reduce((m, b) => Math.max(m, parseInt(b.n, 10) || 0), 0) + 1).padStart(2, "0");
    const book: Ebook = { id, slug, n, title, subtitle: "", oneLiner: "", tone: "blue", pages: 0, readTime: "", chapters: [], enabled: false, approvalMode: "inherit", deliveryMode: "inherit", requests: 0, sent: 0, downloads: 0 };
    add(book);
    setOpenId(id);
  };

  useEffect(() => {
    if (sp.get("new") !== "1") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the one-shot `new=1` param means "create a book right now"
    createBook();
    router.replace("/admin/books");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once for the one-shot `new=1` param only
  }, []);

  const openIndex = openId ? books.findIndex((b) => b.id === openId) : -1;
  const openBook = openIndex >= 0 ? books[openIndex] : undefined;

  const live = books.filter((b) => b.enabled).length;
  const totalRequests = books.reduce((s, b) => s + b.requests, 0);
  const totalDownloads = books.reduce((s, b) => s + b.downloads, 0);
  const missingPdf = books.filter((b) => !b.pdfFileId).length;

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Books"
        description="Your free e-books — what's on the shelf, the cover, and the PDF visitors receive."
        actions={
          <Button variant="primary" onClick={createBook}>
            <Icon name="plus" size={14} /> New book
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTileSmall label="Live books" value={`${live} / ${books.length}`} />
        <StatTileSmall label="Requests" value={totalRequests} />
        <StatTileSmall label="Downloads" value={totalDownloads} />
        <StatTileSmall label="Missing PDFs" value={missingPdf} warn={missingPdf > 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {books.map((b, i) => (
          <div key={b.id} className="st-panel flex gap-4 p-4 sm:flex-col sm:gap-3">
            {/* the cover on a small stage, turned like a book on the website's shelf */}
            <button
              type="button"
              onClick={() => setOpenId(b.id)}
              className="grid w-[92px] shrink-0 place-items-center rounded-xl bg-[radial-gradient(ellipse_at_50%_80%,rgb(140_107_255/.16),transparent_70%)] py-2 sm:w-full sm:py-6"
              aria-label={`Edit “${b.title || "Untitled book"}”`}
            >
              <TiltCover book={b} className="w-[72px] sm:w-[128px]" />
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div>
                <button type="button" onClick={() => setOpenId(b.id)} className="block w-full truncate text-left text-[13.5px] font-medium text-st-ink hover:underline">
                  {b.title || "Untitled book"}
                </button>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone={b.enabled ? "good" : "default"}>{b.enabled ? "Live" : "Hidden"}</Badge>
                  <Badge tone={b.pdfFileId ? "good" : "warn"} icon={<Icon name={b.pdfFileId ? "check" : "alert"} size={11} />}>
                    {b.pdfFileId ? "PDF" : "No PDF yet"}
                  </Badge>
                  {b.requests > 0 && <Badge>{b.requests} requests</Badge>}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-st-border pt-3">
                <span className="text-[12px] text-st-sub">Show on website</span>
                <Switch checked={b.enabled} onChange={(v) => setDraft(["site", "ebooks", i, "enabled"], v)} />
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={createBook} className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-st-border-strong text-st-dim transition-colors hover:border-st-purple/50 hover:text-st-ink">
          <Icon name="plus" size={22} />
          <span className="text-[13px] font-medium">New book</span>
        </button>
      </div>

      <Drawer open={!!openBook} onClose={() => setOpenId(null)} title={openBook?.title || "Book"} wide>
        {openBook && (
          <BookEditor
            index={openIndex}
            onDelete={() => {
              remove(openIndex);
              setOpenId(null);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={null}>
      <BooksInner />
    </Suspense>
  );
}
