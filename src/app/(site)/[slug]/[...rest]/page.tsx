import { notFound } from "next/navigation";

// any deeper unknown address (/foo/bar/) gets the site's own 404 page — with the nav and theme —
// instead of Next's bare default (the app has two root layouts, so there's no app-wide not-found)
export default function UnknownDeepPage() {
  notFound();
}
