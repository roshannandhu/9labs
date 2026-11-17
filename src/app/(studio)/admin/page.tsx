"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { fadeUp } from "@/studio/motion";
import { PageHeader, RoleNote, Segmented } from "@/studio/ui";
import { useSession } from "@/studio/state";
import { useDashboardData, type Range } from "@/studio/dashboard/data";
import {
  AfterQuizPanel,
  AiHealthPanel,
  BudgetsPanel,
  BusiestTimesPanel,
  EbooksPanel,
  InterestByServicePanel,
  KpiStrip,
  LatestActivityPanel,
  LeadMixPanel,
  LeadsOverTimePanel,
  SystemStatusPanel,
  TimelinesPanel,
} from "@/studio/dashboard/panels";

const RANGE_OPTIONS: { value: "7" | "30" | "90"; label: string }[] = [
  { value: "7", label: "7D" },
  { value: "30", label: "30D" },
  { value: "90", label: "90D" },
];

function Fade({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div className={className} variants={fadeUp(i)} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export default function DashboardPage() {
  const session = useSession();
  const [rangeStr, setRangeStr] = useState<"7" | "30" | "90">("30");
  const range = Number(rangeStr) as Range;
  const wide = useMediaQuery("(min-width: 1024px)", true);
  const data = useDashboardData(range);

  const canSeeLeads = session?.role !== "editor";

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Dashboard"
        description="Everything happening on the website, at a glance."
        actions={canSeeLeads ? <Segmented options={RANGE_OPTIONS} value={rangeStr} onChange={setRangeStr} layoutId="dash-range" /> : undefined}
      />

      {!canSeeLeads && (
        <>
          <RoleNote what="Lead numbers are visible to Owners and Admins." />
          <Fade i={0}>
            <SystemStatusPanel data={data} />
          </Fade>
        </>
      )}

      {canSeeLeads && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          <Fade i={0} className="md:col-span-2 lg:col-span-12">
            <KpiStrip data={data} range={range} />
          </Fade>
          <Fade i={1} className="md:col-span-2 lg:col-span-8">
            <LeadsOverTimePanel data={data} />
          </Fade>
          <Fade i={2} className="md:col-span-2 lg:col-span-4">
            <LeadMixPanel data={data} />
          </Fade>
          <Fade i={3} className="md:col-span-2 lg:col-span-7">
            <InterestByServicePanel data={data} />
          </Fade>
          <Fade i={4} className="md:col-span-2 lg:col-span-5">
            <EbooksPanel data={data} />
          </Fade>
          <Fade i={5} className="md:col-span-1 lg:col-span-4">
            <AfterQuizPanel data={data} />
          </Fade>
          <Fade i={6} className="md:col-span-1 lg:col-span-4">
            <BudgetsPanel data={data} />
          </Fade>
          <Fade i={7} className="md:col-span-2 lg:col-span-4">
            <TimelinesPanel data={data} />
          </Fade>
          <Fade i={8} className="md:col-span-2 lg:col-span-12">
            <BusiestTimesPanel data={data} wide={wide} />
          </Fade>
          <Fade i={9} className="md:col-span-2 lg:col-span-8">
            <LatestActivityPanel data={data} />
          </Fade>
          <Fade i={10} className="md:col-span-2 lg:col-span-4">
            <SystemStatusPanel data={data} />
          </Fade>
          <Fade i={11} className="md:col-span-2 lg:col-span-12">
            <AiHealthPanel />
          </Fade>
        </div>
      )}
    </div>
  );
}
