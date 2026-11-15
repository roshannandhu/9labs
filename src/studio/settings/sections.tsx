"use client";

import { useRef, useState } from "react";
import { waLink } from "@/content/site";
import type { AdminRole } from "@/content/types";
import { SocialIcon } from "@/components/icons/SocialIcon";
import { addAdmin, checkpoint, clearSampleLeads, downloadBackup, loadSampleData, removeAdmin, resetAll, restoreBackup, setDraft, updateAdmin } from "@/lib/store";
import { ColorField, Dropzone, Slider, TextField } from "../Field";
import { Icon } from "../Icon";
import { useAdmins, useDraft, useSession } from "../state";
import { Avatar, Button, Panel, RoleNote, Segmented, Switch, useConfirm, useToast } from "../ui";

/** A setting card: a title, a one-line description, the fields, and a footer naming where it shows up. */
function SettingCard({ title, help, appearsOn, children }: { title: string; help?: string; appearsOn?: string; children: React.ReactNode }) {
  return (
    <Panel title={title} help={help} footer={appearsOn ? <p className="st-help">Appears on: {appearsOn}</p> : undefined}>
      {children}
    </Panel>
  );
}

function Hint({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span className={`mt-1 flex items-center gap-1 text-[11.5px] font-medium ${ok ? "text-st-good" : "text-st-dim"}`}>
      {ok && <Icon name="check" size={11} />}
      {ok ? yes : no}
    </span>
  );
}

/* ------------------------------------------------------------------ Company details */

export function CompanySection() {
  const draft = useDraft();
  const c = draft.site.contact;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email);
  const waOk = /^\d{8,15}$/.test(c.whatsappNumber);

  return (
    <div className="grid gap-4">
      <SettingCard title="Business" appearsOn="Footer, Google results, e-mails">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <TextField path={["site", "name"]} label="Company name" />
          <TextField path={["site", "shortName"]} label="Short name" />
        </div>
        <TextField path={["site", "tagline"]} label="One-line description" help="Shown in the footer." />
      </SettingCard>

      <SettingCard title="Location" appearsOn="Footer, contact section, About page">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <TextField path={["site", "location"]} label="Area / address" />
          <TextField path={["site", "mapUrl"]} label="Map link" />
        </div>
        {draft.site.mapUrl && (
          <a href={draft.site.mapUrl} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-1 text-[12px] font-medium text-st-purple hover:underline">
            Open map <Icon name="arrow-up-right" size={11} />
          </a>
        )}
      </SettingCard>

      <SettingCard title="Contact" appearsOn="Contact section, footer">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <TextField path={["site", "contact", "email"]} label="E-mail" />
            <Hint ok={emailOk} yes="Valid" no="Not a valid e-mail yet" />
          </div>
          <TextField path={["site", "contact", "phone"]} label="Phone (as shown)" />
        </div>
      </SettingCard>

      <SettingCard title="WhatsApp" appearsOn="Every WhatsApp button, the enquiry window, the quiz">
        <div>
          <TextField path={["site", "contact", "whatsappNumber"]} label="Number" help="Digits only, with the country code — e.g. 971501234567." />
          <Hint ok={waOk} yes="Valid" no="8–15 digits, country code first" />
        </div>
        <TextField path={["site", "contact", "whatsappText"]} label="Pre-filled message" />
        {waOk && (
          <a href={waLink(c.whatsappNumber, c.whatsappText)} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-1 text-[12px] font-medium text-st-purple hover:underline">
            Test this link <Icon name="arrow-up-right" size={11} />
          </a>
        )}
      </SettingCard>

      <SettingCard title="Social links" help="A link shows on the site only when it's switched on and starts with https://." appearsOn="Footer, mobile menu, About page">
        <div className="grid gap-2.5">
          {draft.site.socials.map((s, i) => {
            const set = s.href.trim().startsWith("https://") || s.href.trim() === "#";
            return (
              <div key={s.key} className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-st-panel-2 text-st-sub">
                  <SocialIcon name={s.key} size={14} />
                </span>
                <span className="w-20 shrink-0 text-[12.5px] capitalize text-st-sub">{s.label}</span>
                <div className="flex-1">
                  <TextField path={["site", "socials", i, "href"]} label="" placeholder="https://…" />
                </div>
                {!set && <span className="shrink-0 text-[11px] text-st-dim">not set yet</span>}
              </div>
            );
          })}
        </div>
      </SettingCard>
    </div>
  );
}

/* ------------------------------------------------------------------ Google & tracking */

export function GoogleSection() {
  const draft = useDraft();
  const seo = draft.site.seo;
  const ga4Ok = !draft.site.integrations.ga4 || /^G-[A-Z0-9]+$/i.test(draft.site.integrations.ga4);
  const gtmOk = !draft.site.integrations.gtm || /^GTM-[A-Z0-9]+$/i.test(draft.site.integrations.gtm);
  const pixelOk = !draft.site.integrations.metaPixel || /^\d+$/.test(draft.site.integrations.metaPixel);

  return (
    <div className="grid gap-4">
      <SettingCard title="Search result">
        <div>
          <TextField path={["site", "seo", "title"]} label="Homepage title" />
          <p className={`mt-1 text-[11px] ${seo.title.length > 60 ? "text-st-warn" : "text-st-dim"}`}>{seo.title.length} / 60</p>
        </div>
        <TextField path={["site", "seo", "titleTemplate"]} label="Title of other pages" help="%s is replaced by the page's own title." />
        {!seo.titleTemplate.includes("%s") && <p className="text-[11.5px] text-st-warn">Missing %s — every page would share the same title.</p>}
        <div>
          <TextField path={["site", "seo", "description"]} label="Description" />
          <p className={`mt-1 text-[11px] ${seo.description.length > 155 ? "text-st-warn" : "text-st-dim"}`}>{seo.description.length} / 155</p>
        </div>
        <Switch checked={seo.index} onChange={(v) => { checkpoint(); setDraft(["site", "seo", "index"], v); }} label="Allow search engines to list the site" />
      </SettingCard>

      <SettingCard title="Live preview">
        <div className="rounded-xl border border-st-border bg-white p-4">
          <p className="truncate text-[13px] text-[#1a0dab]">{seo.title || "Untitled"}</p>
          <p className="truncate text-[12px] text-[#006621]">{draft.site.url}</p>
          <p className="mt-0.5 line-clamp-2 text-[12.5px] text-[#545454]">{seo.description || "No description set yet."}</p>
        </div>
      </SettingCard>

      <SettingCard title="Analytics & ads" help="Tracking only starts after a visitor accepts cookies.">
        <div>
          <TextField path={["site", "integrations", "ga4"]} label="Google Analytics ID" placeholder="G-XXXXXXXXXX" />
          <Hint ok={!!draft.site.integrations.ga4 && ga4Ok} yes="Valid format" no={draft.site.integrations.ga4 ? "Check the format" : "Not set"} />
        </div>
        <div>
          <TextField path={["site", "integrations", "gtm"]} label="Google Tag Manager ID" placeholder="GTM-XXXXXXX" />
          <Hint ok={!!draft.site.integrations.gtm && gtmOk} yes="Valid format" no={draft.site.integrations.gtm ? "Check the format" : "Not set"} />
        </div>
        <div>
          <TextField path={["site", "integrations", "metaPixel"]} label="Meta Pixel ID" placeholder="Digits only" />
          <Hint ok={!!draft.site.integrations.metaPixel && pixelOk} yes="Valid format" no={draft.site.integrations.metaPixel ? "Digits only" : "Not set"} />
        </div>
      </SettingCard>

      <SettingCard title="Cookie notice">
        <TextField path={["site", "integrations", "cookieText"]} label="Text" />
        <div className="grid gap-3.5 sm:grid-cols-2">
          <TextField path={["site", "integrations", "cookieAccept"]} label="Accept button" />
          <TextField path={["site", "integrations", "cookieDecline"]} label="Decline button" />
        </div>
      </SettingCard>
    </div>
  );
}

/* ------------------------------------------------------------------ Brand & theme */

const COLOR_FIELDS: { path: ["site", "theme", "colors", string]; label: string }[] = [
  { path: ["site", "theme", "colors", "blue"], label: "Main colour — buttons and links" },
  { path: ["site", "theme", "colors", "purple"], label: "Accent colour — highlights" },
  { path: ["site", "theme", "colors", "indigo"], label: "Deep colour — headings on light" },
  { path: ["site", "theme", "colors", "bg"], label: "Light background" },
  { path: ["site", "theme", "colors", "darkBg"], label: "Dark background" },
  { path: ["site", "theme", "colors", "logoFrom"], label: "Logo gradient — start" },
  { path: ["site", "theme", "colors", "logoTo"], label: "Logo gradient — end" },
];

export function BrandSection() {
  const draft = useDraft();
  const toast = useToast();
  const confirm = useConfirm();
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  const c = draft.site.theme.colors;
  const blue = c.blue || "#6f55e8";
  const indigo = c.indigo || "#3530d0";
  const bg = previewTheme === "dark" ? c.darkBg || "#0b0a12" : c.bg || "#e9ddeb";
  const ink = previewTheme === "dark" ? "#f3f1fb" : "#0e0c20";

  return (
    <div className="grid gap-4">
      <SettingCard title="Colours" help="Empty keeps the built-in colour.">
        <div className="grid gap-3.5 sm:grid-cols-2">
          {COLOR_FIELDS.map((f) => (
            <ColorField key={f.path.join(".")} path={f.path} label={f.label} />
          ))}
        </div>
        <Button
          onClick={async () => {
            const ok = await confirm({ title: "Reset all colours?", body: "Every colour goes back to the built-in default." });
            if (!ok) return;
            checkpoint();
            setDraft(["site", "theme", "colors"], {});
            toast("ok", "Colours reset.");
          }}
          className="w-fit"
        >
          Reset all colours
        </Button>
      </SettingCard>

      <SettingCard title="Live preview">
        <Segmented layoutId="brand-preview" size="sm" value={previewTheme} onChange={setPreviewTheme} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
        <div className="overflow-hidden rounded-xl border border-st-border" style={{ background: bg, color: ink }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${ink}1a` }}>
            <span className="flex items-center gap-1.5 text-[12px] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: blue }} /> {draft.site.shortName}
            </span>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white" style={{ background: `linear-gradient(120deg, ${blue}, ${indigo})` }}>
              {draft.site.navCta.label}
            </span>
          </div>
          <div className="px-4 py-6">
            <p className="text-[15px] font-semibold">
              {draft.site.hero.headline} <span style={{ color: blue }}>{draft.site.hero.headlineAccent}</span>
            </p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-white" style={{ background: `linear-gradient(120deg, ${blue}, ${indigo})` }}>
                {draft.site.hero.primary.label}
              </span>
              <span className="rounded-full border px-3 py-1.5 text-[11px] font-semibold" style={{ borderColor: `${ink}33` }}>
                {draft.site.hero.secondary.label}
              </span>
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard title="Light & dark">
        <Segmented layoutId="brand-default-theme" value={draft.site.theme.default} onChange={(v) => { checkpoint(); setDraft(["site", "theme", "default"], v); }} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
        <Switch checked={draft.site.theme.toggle} onChange={(v) => { checkpoint(); setDraft(["site", "theme", "toggle"], v); }} label="Let visitors switch light/dark" />
        <Switch checked={draft.site.theme.intro} onChange={(v) => { checkpoint(); setDraft(["site", "theme", "intro"], v); }} label="Play the logo animation on a first visit" />
        <Slider path={["site", "theme", "grid"]} label="Background grid strength" min={0} max={0.2} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
      </SettingCard>
    </div>
  );
}

/* ------------------------------------------------------------------ Team */

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
];
const ROLE_CAN: Record<AdminRole, string> = { owner: "Everything, including the team", admin: "Inbox, Books, Quiz, Settings except Team", editor: "Books and Quiz only, no leads" };

export function TeamSection() {
  const session = useSession();
  const admins = useAdmins();
  const confirm = useConfirm();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("editor");

  const onUpdateAdmin = async (id: string, patch: Partial<{ role: AdminRole; active: boolean }>) => {
    try {
      await updateAdmin(id, patch);
    } catch (err) {
      toast("bad", err instanceof Error ? err.message : "Could not update that.");
    }
  };

  if (session?.role !== "owner") return <RoleNote what="Only Owners can manage who signs in." />;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {ROLE_OPTIONS.map((r) => (
          <div key={r.value} className="st-panel p-3.5">
            <p className="text-[13px] font-semibold capitalize text-st-ink">{r.label}</p>
            <p className="st-help mt-0.5">{ROLE_CAN[r.value]}</p>
          </div>
        ))}
      </div>

      <SettingCard title="Members">
        <div className="grid gap-2">
          {admins.map((a) => {
            const isSelf = a.email === session?.email;
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-st-border p-3">
                <Avatar letter={a.name || a.email} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-st-ink">{a.name || a.email}</p>
                  <p className="st-help truncate">{a.email}</p>
                </div>
                <select disabled={isSelf} value={a.role} onChange={(e) => void onUpdateAdmin(a.id, { role: e.target.value as AdminRole })} className="st-field w-auto disabled:opacity-50">
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-[12px] text-st-sub">
                  <input type="checkbox" disabled={isSelf} checked={a.active} onChange={(e) => void onUpdateAdmin(a.id, { active: e.target.checked })} className="h-3.5 w-3.5 accent-[var(--st-purple)] disabled:opacity-50" />
                  Can sign in
                </label>
                <span className="w-20 shrink-0 text-[11px] text-st-dim">{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Never signed in"}</span>
                {isSelf ? (
                  <span className="shrink-0 text-[11px] text-st-dim" title="You can't change your own access">
                    You
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({ title: `Remove ${a.email}?`, body: "They'll no longer be able to sign in.", confirmLabel: "Remove", danger: true });
                      if (!ok) return;
                      try {
                        await removeAdmin(a.id);
                        toast("ok", "Removed.");
                      } catch (err) {
                        toast("bad", err instanceof Error ? err.message : "Could not remove them.");
                      }
                    }}
                    className="shrink-0 text-[11.5px] text-st-dim hover:text-st-danger"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </SettingCard>

      <SettingCard title="Invite someone">
        <div className="flex flex-wrap items-end gap-2">
          <input className="st-field flex-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Google e-mail" />
          <input className="st-field flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="st-field w-auto">
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={async () => {
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
                toast("bad", "Enter a valid e-mail address.");
                return;
              }
              try {
                await addAdmin(email, name || email.split("@")[0], role);
                setEmail("");
                setName("");
                toast("ok", "Added.");
              } catch (err) {
                toast("bad", err instanceof Error ? err.message : "Could not add them.");
              }
            }}
          >
            Add
          </Button>
        </div>
      </SettingCard>
    </div>
  );
}

/* ------------------------------------------------------------------ Backup & reset */

export function BackupSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const sampleSeedAvailable = process.env.NEXT_PUBLIC_SAMPLE_SEED === "1";

  return (
    <div className="grid gap-4">
      <SettingCard title="Download a backup" help="Content and leads in one file. Uploaded files stay in storage.">
        <Button
          variant="primary"
          className="w-fit"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await downloadBackup();
            } catch (err) {
              toast("bad", err instanceof Error ? err.message : "Could not download the backup.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Icon name="download" size={14} /> {busy ? "Preparing…" : "Download backup"}
        </Button>
      </SettingCard>

      <SettingCard title="Restore from a backup" help="Replaces content and leads; the team stays.">
        <Dropzone
          accept="application/json"
          label=""
          hint="A .json backup file"
          onFile={async (file) => {
            if (!file) return;
            const ok = await confirm({ title: "Restore this backup?", body: "This replaces the content and leads currently here.", confirmLabel: "Restore", danger: true });
            if (!ok) return;
            try {
              await restoreBackup(file);
              toast("ok", "Restored.");
            } catch (err) {
              toast("bad", err instanceof Error ? err.message : "Could not restore that file.");
            }
          }}
        />
        <input ref={fileRef} type="file" className="hidden" />
      </SettingCard>

      <SettingCard title="Remove sample data" help="Clears every lead, demo leads included. Content stays as it is.">
        <Button
          variant="danger"
          className="w-fit"
          onClick={async () => {
            const ok = await confirm({ title: "Remove sample data?", body: "Every enquiry, book request and quiz result is cleared.", confirmLabel: "Remove", danger: true });
            if (!ok) return;
            try {
              await clearSampleLeads();
              toast("ok", "Removed.");
            } catch (err) {
              toast("bad", err instanceof Error ? err.message : "Could not remove the sample data.");
            }
          }}
        >
          Remove sample data
        </Button>
      </SettingCard>

      {sampleSeedAvailable && (
        <SettingCard title="Load sample data" help="Dev only — adds demo enquiries, book requests and quiz results for testing.">
          <Button
            className="w-fit"
            onClick={async () => {
              try {
                await loadSampleData();
                toast("ok", "Loaded.");
              } catch (err) {
                toast("bad", err instanceof Error ? err.message : "Could not load sample data.");
              }
            }}
          >
            Load sample data
          </Button>
        </SettingCard>
      )}

      <SettingCard title="Start over" help="Erases every setting and lead back to the built-in defaults.">
        <Button
          variant="danger"
          className="w-fit"
          onClick={async () => {
            const ok = await confirm({ title: "Reset everything?", body: "This erases every setting and lead. It can't be undone.", confirmLabel: "Reset", danger: true, typeToConfirm: "RESET" });
            if (!ok) return;
            try {
              await resetAll();
              toast("ok", "Reset.");
            } catch (err) {
              toast("bad", err instanceof Error ? err.message : "Could not reset.");
            }
          }}
        >
          Start over
        </Button>
      </SettingCard>
    </div>
  );
}

