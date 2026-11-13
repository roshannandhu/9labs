"use client";

import { useRef, useState } from "react";
import type { AdminRole } from "@/content/types";
import { exportBackup, importBackup } from "@/lib/backup";
import { addAdmin, checkpoint, clearSampleLeads, outboxKindLabel, removeAdmin, resetAll, restoreVersion, updateAdmin } from "@/lib/store";
import { ColorField, CheckField, NumField, SelectField, TextField } from "@/studio/Field";
import { useAdmins, useOutbox, useSession, useVersions } from "@/studio/state";
import { Box, Button, Pill, Row, RoleNote, confirmDestroy, relativeTime, useToast } from "@/studio/ui";

const TABS = [
  ["look", "Look"],
  ["seo", "Google & tracking"],
  ["team", "Team"],
  ["outbox", "Outbox"],
  ["history", "History"],
  ["data", "Data"],
] as const;
type Tab = (typeof TABS)[number][0];

function LookTab() {
  return (
    <>
      <Box title="Theme">
        <Row>
          <SelectField path={["site", "theme", "default"]} label="Theme a new visitor sees" options={[{ value: "light", label: "Light (lavender)" }, { value: "dark", label: "Dark" }]} />
          <CheckField path={["site", "theme", "toggle"]} label="Let visitors switch light/dark" />
          <CheckField path={["site", "theme", "intro"]} label="Play the logo animation on a first visit" />
        </Row>
        <NumField path={["site", "theme", "grid"]} label="Background grid strength" min={0} max={0.2} step={0.01} />
      </Box>
      <Box title="Brand colours" help="Empty fields keep the built-in colours.">
        <Row>
          <ColorField path={["site", "theme", "colors", "blue"]} label="Light theme — main colour" />
          <ColorField path={["site", "theme", "colors", "purple"]} label="Light theme — accent" />
          <ColorField path={["site", "theme", "colors", "indigo"]} label="Light theme — deep colour" />
          <ColorField path={["site", "theme", "colors", "bg"]} label="Light theme — background" />
        </Row>
        <Row>
          <ColorField path={["site", "theme", "colors", "darkBg"]} label="Dark theme — background" />
          <ColorField path={["site", "theme", "colors", "logoFrom"]} label="Highlight gradient — start" />
          <ColorField path={["site", "theme", "colors", "logoTo"]} label="Highlight gradient — end" />
        </Row>
      </Box>
    </>
  );
}

function SeoTab() {
  return (
    <>
      <Box title="Google & sharing">
        <TextField path={["site", "seo", "title"]} label="Homepage title" />
        <TextField path={["site", "seo", "titleTemplate"]} label="Title of other pages" help="%s is replaced by the page's own title." />
        <TextField path={["site", "seo", "description"]} label="Description" help="About 150 characters." />
        <CheckField path={["site", "seo", "index"]} label="Allow search engines to list the site" />
      </Box>
      <Box title="Analytics" help="Tracking starts only after a visitor accepts the cookie notice.">
        <Row>
          <TextField path={["site", "integrations", "ga4"]} label="Google Analytics ID" placeholder="G-XXXXXXXXXX" />
          <TextField path={["site", "integrations", "gtm"]} label="Google Tag Manager ID" placeholder="GTM-XXXXXXX" />
          <TextField path={["site", "integrations", "metaPixel"]} label="Meta Pixel ID" placeholder="Numbers only" />
        </Row>
        <TextField path={["site", "integrations", "cookieText"]} label="Cookie notice text" />
      </Box>
    </>
  );
}

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
];

function TeamTab() {
  const session = useSession();
  const admins = useAdmins();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("editor");

  if (session?.role !== "owner") return <RoleNote what="Only Owners can manage who signs in." />;

  return (
    <Box title="Admins" help="Each signs in with the Google account of the e-mail listed here. Switch “Can sign in” off to remove someone's access.">
      <div className="grid grid-cols-1 gap-2">
        {admins.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-2.5 rounded-xl border border-st-border p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-st-ink">{a.name || a.email}</p>
              <p className="st-help truncate">{a.email}</p>
            </div>
            <select value={a.role} onChange={(e) => updateAdmin(a.id, { role: e.target.value as AdminRole })} className="st-field !w-auto">
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[12px] text-st-sub">
              <input type="checkbox" checked={a.active} onChange={(e) => updateAdmin(a.id, { active: e.target.checked })} className="h-3.5 w-3.5 accent-[var(--st-purple)]" />
              Can sign in
            </label>
            {a.email !== session?.email && (
              <button
                type="button"
                onClick={() => {
                  if (!confirmDestroy(`Remove ${a.email}?`)) return;
                  removeAdmin(a.id);
                  toast("ok", "Removed.");
                }}
                className="text-[12px] text-st-dim hover:text-st-danger"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2 border-t border-st-border pt-3.5">
        <input className="st-field flex-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Google e-mail" />
        <input className="st-field flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="st-field !w-auto">
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          onClick={() => {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
              toast("bad", "Enter a valid e-mail address.");
              return;
            }
            addAdmin(email, name || email.split("@")[0], role);
            setEmail("");
            setName("");
            toast("ok", "Added.");
          }}
        >
          Create new
        </Button>
      </div>
    </Box>
  );
}

function OutboxTab() {
  const outbox = useOutbox();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Box title="Outbox" help="There is no mailbox connected yet — every e-mail this build would send lands here instead, exactly as it would be sent.">
      {outbox.length === 0 && <p className="text-[13.5px] text-st-sub">Nothing sent yet.</p>}
      <div className="grid grid-cols-1 gap-2">
        {outbox.map((m) => (
          <div key={m.id} className="rounded-xl border border-st-border">
            <button type="button" onClick={() => setOpen(open === m.id ? null : m.id)} className="flex w-full flex-wrap items-center gap-3 p-3 text-left">
              <Pill>{outboxKindLabel[m.kind]}</Pill>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-st-ink">{m.subject}</p>
                <p className="st-help">
                  To {m.to} · {relativeTime(m.createdAt)}
                </p>
              </div>
            </button>
            {open === m.id && <iframe title={m.subject} srcDoc={m.html || `<pre style="white-space:pre-wrap;font-family:sans-serif">${m.text}</pre>`} className="h-[320px] w-full border-t border-st-border bg-white" />}
          </div>
        ))}
      </div>
    </Box>
  );
}

function HistoryTab() {
  const versions = useVersions();
  const toast = useToast();
  return (
    <Box title="Versions" help="Every Publish is saved here. Restore brings a version back live immediately.">
      {versions.length === 0 && <p className="text-[13.5px] text-st-sub">Nothing published yet.</p>}
      <div className="grid grid-cols-1 gap-2">
        {versions.map((v) => (
          <details key={v.id} className="rounded-xl border border-st-border p-3">
            <summary className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-[13px] text-st-ink">{new Date(v.at).toLocaleString()}</span>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  if (!confirmDestroy("Restore this version? It becomes live immediately.")) return;
                  checkpoint();
                  restoreVersion(v.id);
                  toast("ok", "Restored.");
                }}
              >
                Restore
              </Button>
            </summary>
            <div className="mt-2 grid gap-1">
              {v.summary.length === 0 && <p className="st-help">No details recorded.</p>}
              {v.summary.map((s, i) => (
                <p key={i} className="text-[12px] text-st-sub">
                  {s}
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </Box>
  );
}

function DataTab() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Box title="Backup">
        <p className="text-[13px] text-st-sub">Everything: the website, leads, books and uploaded files, in one file.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={async () => {
              setBusy(true);
              await exportBackup();
              setBusy(false);
            }}
            disabled={busy}
          >
            {busy ? "Preparing…" : "Export backup"}
          </Button>
          <Button onClick={() => fileRef.current?.click()}>Import backup</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (!confirmDestroy("Import this backup? It replaces everything currently here.")) return;
              setBusy(true);
              const res = await importBackup(file);
              setBusy(false);
              toast(res.ok ? "ok" : "bad", res.ok ? "Imported." : res.error);
            }}
          />
        </div>
      </Box>
      <Box title="Demo data" help="Clears the sample leads this build starts with, without touching your own edits.">
        <Button
          variant="danger"
          onClick={() => {
            if (!confirmDestroy("Remove the sample enquiries, book requests and quiz results?")) return;
            clearSampleLeads();
            toast("ok", "Removed.");
          }}
        >
          Remove sample data
        </Button>
      </Box>
      <Box title="Start over" help="Erases everything in this browser — content, leads and files — back to the built-in defaults.">
        <Button
          variant="danger"
          onClick={() => {
            if (!confirmDestroy("Reset everything? This can't be undone.")) return;
            resetAll();
            toast("ok", "Reset.");
          }}
        >
          Reset everything
        </Button>
      </Box>
    </>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("look");
  return (
    <div className="grid grid-cols-1 gap-4">
      <h1 className="font-display text-[22px] font-semibold text-st-ink">Settings</h1>
      <nav className="flex flex-wrap gap-1.5 border-b border-st-border pb-3">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${tab === id ? "bg-st-indigo text-white" : "text-st-sub hover:text-st-ink"}`}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "look" && <LookTab />}
      {tab === "seo" && <SeoTab />}
      {tab === "team" && <TeamTab />}
      {tab === "outbox" && <OutboxTab />}
      {tab === "history" && <HistoryTab />}
      {tab === "data" && <DataTab />}
    </div>
  );
}
