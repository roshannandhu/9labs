import type { CSSProperties, ReactNode } from "react";
import type { Ebook } from "@/content/site";
import { BookCover, BookSpine } from "./BookCover";

type Props = {
  book: Ebook;
  /** Book face width / height / depth (CSS lengths). */
  w: string;
  h: string;
  d?: string;
  ry?: string;
  rx?: string;
  bx?: string;
  bz?: string;
  /** Cover swung open (inside-cover content visible on the left). */
  open?: boolean;
  /** Form page turned over (success page visible on the right). */
  turned?: boolean;
  insideCover?: ReactNode;
  firstPage?: ReactNode;
  underPage?: ReactNode;
  className?: string;
};

/**
 * A real CSS-3D book: cover, spine, back and page edges, plus two hinged leaves
 * (the cover and the first page) that can swing open around the spine.
 */
export function Book3D({ book, w, h, d = "30px", ry, rx, bx, bz, open, turned, insideCover, firstPage, underPage, className = "" }: Props) {
  // Only set the transforms that were passed, so CSS (e.g. shelf hover) can drive the rest.
  const style: Record<string, string> = { "--bw": w, "--bh": h, "--bd": d };
  if (ry !== undefined) style["--ry"] = ry;
  if (rx !== undefined) style["--rx"] = rx;
  if (bx !== undefined) style["--bx"] = bx;
  if (bz !== undefined) style["--bz"] = bz;

  return (
    <div className={`book ${className}`} style={style as CSSProperties}>
      <div className="book-back" />
      <div className="book-spine overflow-hidden">
        <BookSpine book={book} />
      </div>
      <div className="book-edge-right" />
      <div className="book-edge-top" />
      <div className="book-edge-bottom" />

      {/* page under everything (success) */}
      <div className="book-page paper paper-right">{underPage}</div>

      {/* first page (form) — turns over on success */}
      {firstPage && (
        <div className="book-leaf" style={{ "--lz": `calc(${d} / 2 - 1.5px)`, "--la": turned ? "-176deg" : "0deg" } as CSSProperties}>
          <div className="face face-front paper paper-right">{firstPage}</div>
          <div className="face face-back paper paper-left">
            <div className="grid h-full place-items-center">
              <span className="font-display text-[64px] font-bold text-white/[0.04]">9</span>
            </div>
          </div>
        </div>
      )}

      {/* cover — swings open */}
      <div className="book-leaf" style={{ "--lz": `calc(${d} / 2)`, "--la": open ? "-178deg" : "0deg" } as CSSProperties}>
        <div className="face face-front overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
          <BookCover book={book} />
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,.09)_48%,transparent_60%)]" />
        </div>
        <div className="face face-back paper paper-left">{insideCover}</div>
      </div>
    </div>
  );
}
