"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Icon, type IconName } from "@/studio/Icon";
import { BackupSection, BrandSection, CompanySection, GoogleSection, TeamSection } from "@/studio/settings/sections";
import { Badge, PageHeader } from "@/studio/ui";

type SectionId = "company" | "google" | "brand" | "team" | "backup";
type Group = "GENERAL" | "APPEARANCE" | "ACCESS" | "DATA";

const SECTIONS: { id: SectionId; title: string; description: string; icon: IconName; group: Group; apply: "publish" | "instant"; fieldLabels: string[] }[] = [
  { id: "company", title: "Company details", description: "Name, location, contact and social links.", icon: "building", group: "GENERAL", apply: "publish", fieldLabels: ["name", "e-mail", "email", "phone", "whatsapp", "address", "location", "map", "social", "instagram", "facebook", "linkedin"] },
  { id: "google", title: "Google & tracking", description: "Search result, analytics and cookies.", icon: "globe", group: "GENERAL", apply: "publish", fieldLabels: ["seo", "title", "description", "analytics", "ga4", "gtm", "pixel", "cookie", "search"] },
  { id: "brand", title: "Brand & theme", description: "Colours, light/dark and the logo animation.", icon: "palette", group: "APPEARANCE", apply: "publish", fieldLabels: ["colour", "color", "theme", "dark", "light", "grid", "logo"] },
  { id: "team", title: "Team", description: "Who can sign in, and what they can do.", icon: "users", group: "ACCESS", apply: "instant", fieldLabels: ["admin", "owner", "editor", "role", "sign in", "invite", "member"] },
  { id: "backup", title: "Backup & reset", description: "Export, restore, or start over.", icon: "database", group: "DATA", apply: "instant", fieldLabels: ["backup", "export", "import", "restore", "reset", "sample data", "demo"] },
];
const GROUPS: Group[] = ["GENERAL", "APPEARANCE", "ACCESS", "DATA"];

function SettingsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const linkedSection = sp.get("section");
  const initial = (linkedSection as SectionId) ?? "company";
  const [section, setSectionState] = useState<SectionId>(SECTIONS.some((s) => s.id === initial) ? initial : "company");
  const [query, setQuery] = useState("");
  const [mobileShowList, setMobileShowList] = useState(!linkedSection);

  useEffect(() => {
    if (linkedSection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a deep link (e.g. from the dashboard or palette) jumps straight to that section's detail, skipping the phone's list screen
      setMobileShowList(false);
    }
  }, [linkedSection]);

  const setSection = (id: SectionId) => {
    setSectionState(id);
    router.replace(`/admin/settings?section=${id}`);
    setMobileShowList(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.fieldLabels.some((f) => f.includes(q)));
  }, [query]);

  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  return (
    <div className="grid gap-5">
      <PageHeader title="Settings" description="Everything that shapes the site, in one place." />

      <div className="sm:grid sm:grid-cols-[220px_1fr] sm:gap-6 lg:grid-cols-[260px_1fr]">
        <div className={`${mobileShowList ? "block" : "hidden"} sm:block`}>
          {/* grid-cols-1 (minmax 0): the search input's built-in min width otherwise widens this track past its column */}
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-st-dim">
                <Icon name="search" size={14} />
              </span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search settings…" className="st-field pl-9" />
            </div>
            {GROUPS.map((g) => {
              const items = filtered.filter((s) => s.group === g);
              if (!items.length) return null;
              return (
                <div key={g}>
                  <p className="st-micro px-1 pb-1.5">{g}</p>
                  <div className="grid gap-0.5">
                    {items.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSection(s.id)}
                        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${section === s.id ? "bg-st-panel-3" : "hover:bg-st-panel-2"}`}
                      >
                        {section === s.id && <motion.span layoutId="settings-active" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-st-grad" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                        <span className={section === s.id ? "text-st-purple" : "text-st-dim"}>
                          <Icon name={s.icon} size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-st-ink">{s.title}</span>
                          <span className="block truncate text-[11.5px] text-st-dim">{s.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="px-1 text-[12.5px] text-st-dim">No settings match “{query}”.</p>}
          </div>
        </div>

        <div className={`${mobileShowList ? "hidden" : "block"} sm:block`}>
          <button type="button" onClick={() => setMobileShowList(true)} className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-st-sub sm:hidden">
            <span className="rotate-90">
              <Icon name="chevron" size={13} />
            </span>
            Settings
          </button>

          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[16px] font-semibold text-st-ink">{active.title}</h2>
              <p className="text-[12.5px] text-st-sub">{active.description}</p>
            </div>
            <Badge tone={active.apply === "publish" ? "brand" : "default"}>{active.apply === "publish" ? "Publish to apply" : "Instant"}</Badge>
          </div>

          {section === "company" && <CompanySection />}
          {section === "google" && <GoogleSection />}
          {section === "brand" && <BrandSection />}
          {section === "team" && <TeamSection />}
          {section === "backup" && <BackupSection />}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  );
}
