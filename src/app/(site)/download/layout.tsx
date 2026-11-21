import type { Metadata } from "next";

// a personal download link: never a search result, and not a copy of the homepage
export const metadata: Metadata = {
  title: "Your e-book download",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
