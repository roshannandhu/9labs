"use client";

import { PageHeader } from "@/studio/ui";

export default function InboxPage() {
  return (
    <div className="grid gap-5">
      <PageHeader title="Inbox" description="Everyone who contacted you through the website." />
      <p className="text-[13.5px] text-st-sub">Service enquiries, e-book requests and quiz results — each in their own tab — are being rebuilt next.</p>
    </div>
  );
}
