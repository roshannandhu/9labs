"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageView } from "@/components/pages/PageView";

function PBySlug() {
  const slug = useSearchParams().get("s") ?? "";
  return <PageView slug={slug} />;
}

/**
 * A page the admin added after this site was last built doesn't have a clean static file for its
 * own address (a static export can't invent new HTML files at runtime) — it's reached here
 * instead, e.g. `/p/?s=terms`, until the site is rebuilt.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PBySlug />
    </Suspense>
  );
}
