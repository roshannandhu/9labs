import { PageHeader, PageShell } from "@/components/pages/PageShell";
import { siteHref } from "@/lib/site-href";

export default function NotFound() {
  return (
    <PageShell>
      <PageHeader eyebrow="404" title="This page does not exist." intro="The link may be old, or the page may have moved." />
      <div className="container-x mt-8 max-w-[920px]">
        <a href={siteHref("/")} className="btn btn-primary">
          Back to the homepage
        </a>
      </div>
    </PageShell>
  );
}
