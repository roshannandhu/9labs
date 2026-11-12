import snapshot from "@/content/website.json";
import { AdminEditor, type Snap } from "./AdminEditor";

// The website editor: static, part of the GitHub Pages demo build only (scripts/build-demo.mjs).
// Its page frame (title, styles) is layout.tsx beside it.

export default function Page() {
  return <AdminEditor initial={snapshot as unknown as Snap} />;
}
