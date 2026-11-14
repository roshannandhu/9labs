"use client";

import { PageHeader } from "@/studio/ui";

export default function BooksPage() {
  return (
    <div className="grid gap-5">
      <PageHeader title="Books" description="Your free e-books — what's on the shelf, the cover, and the PDF visitors receive." />
      <p className="text-[13.5px] text-st-sub">The books grid and editor (cover colour, logo, or your own image) are being rebuilt next.</p>
    </div>
  );
}
