import type { Metadata } from "next";
import snapshot from "@/content/website.json";
import { AdminEditor, type Snap } from "./AdminEditor";

// The website editor: static, part of the GitHub Pages demo build only (scripts/build-demo.mjs).
export const metadata: Metadata = { title: "Website editor", robots: { index: false, follow: false } };

export default function Page() {
  return <AdminEditor initial={snapshot as unknown as Snap} />;
}
