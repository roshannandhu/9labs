import { PageHeader, PageShell } from "@/components/pages/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <PageHeader eyebrow="404" title="This page does not exist." intro="The link may be old, or the page may have moved." />
      <div className="container-x mt-8 max-w-[920px]">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load, so the homepage's landing animation and particles start cleanly */}
        <a href="/" className="btn btn-primary">
          Back to the homepage
        </a>
      </div>
    </PageShell>
  );
}
