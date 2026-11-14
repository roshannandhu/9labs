"use client";

import { PageHeader } from "@/studio/ui";

export default function DashboardPage() {
  return (
    <div className="grid gap-5">
      <PageHeader title="Dashboard" description="Everything happening on the website, at a glance." />
      <p className="text-[13.5px] text-st-sub">The full dashboard — KPIs, charts and activity — is being rebuilt next.</p>
    </div>
  );
}
