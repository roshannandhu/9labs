"use client";

import { useEffect, useMemo, useState } from "react";
import type { FaqItem, SectionKey, SiteData } from "@/content/types";
import type { IconKey } from "@/content/site";
import { scoreQuiz, type QuizAnswers } from "@/lib/quiz/score";
import { siteHref } from "@/lib/site-href";
import { paragraphsToRich, richToParagraphs } from "./lexical";

/* ---------------------------------------------------------------- the content file */

export type PageDoc = {
  slug: string;
  title: string;
  eyebrow?: string | null;
  intro?: string | null;
  body?: unknown;
  showStats?: boolean;
  showSteps?: boolean;
  showValues?: boolean;
  showServices?: boolean;
  showCta?: boolean;
  seo?: { title?: string | null; description?: string | null } | null;
  [key: string]: unknown;
};

export type Snap = { generatedAt: string; site: SiteData; pages: PageDoc[]; faqs: FaqItem[] };

/* ---------------------------------------------------------------- GitHub (the file lives in this repository) */

const REPO = process.env.NEXT_PUBLIC_EDIT_REPO ?? "";
const BRANCH = process.env.NEXT_PUBLIC_EDIT_BRANCH ?? "main";
const FILE = process.env.NEXT_PUBLIC_EDIT_PATH ?? "src/content/website.json";
const TOKEN_KEY = "nl-editor-token";
const ACTIVITIES: IconKey[] = ["social", "advertising", "content", "photo", "events", "pr", "strategy", "ai", "it"];
const ACTIVITY_NAMES: Record<IconKey, string> = {
  social: "Social",
  advertising: "Ads",
  content: "Content",
  photo: "Photo",
  events: "Events",
  pr: "PR",
  strategy: "Strategy",
  ai: "AI",
  it: "IT",
};
const SECTION_NAMES: Record<SectionKey, string> = {
  services: "The 9 cards",
  about: "About and values",
  quiz: "The 9 Quiz",
  ebooks: "Free e-books",
  contact: "Contact (closing)",
};

const encodeUtf8 = (s: string) => {
  let bin = "";
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
};
const decodeUtf8 = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

async function gh(path: string, token: string, init: RequestInit = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", ...(init.headers ?? {}) },
  });
}

async function checkToken(token: string): Promise<{ ok: boolean; text: string }> {
  const r = await gh(`/repos/${REPO}`, token);
  if (r.status === 401) return { ok: false, text: "GitHub did not accept that token." };
  if (r.status === 404) return { ok: false, text: "That token cannot see this repository. Check its repository access." };
  if (!r.ok) return { ok: false, text: `GitHub answered ${r.status}. Try again in a moment.` };
  const j = (await r.json()) as { permissions?: { push?: boolean } };
  return j.permissions?.push ? { ok: true, text: "Token accepted: changes can be saved." } : { ok: false, text: "The token can read but not write. It needs Contents: Read and write." };
}

async function loadRemote(token: string): Promise<{ sha: string; data: Snap }> {
  const r = await gh(`/repos/${REPO}/contents/${FILE}?ref=${encodeURIComponent(BRANCH)}`, token);
  if (!r.ok) throw new Error(`Could not read the latest content (GitHub ${r.status}).`);
  const j = (await r.json()) as { sha: string; content: string };
  return { sha: j.sha, data: JSON.parse(decodeUtf8(j.content)) as Snap };
}

/** Empty list lines typed while editing are dropped only when a change is saved. */
function tidy<T>(v: T): T {
  if (Array.isArray(v)) return v.map(tidy).filter((x) => x !== "") as unknown as T;
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = tidy(x);
    return out as T;
  }
  return v;
}

/** Keeps the FAQ's HTML in step with the text the editor changes. */
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const htmlFromText = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

function readyForSave(s: Snap): Snap {
  const t = tidy(s);
  t.faqs = t.faqs.map((f) => ({ ...f, answerHtml: htmlFromText(f.answerText ?? "") }));
  t.pages = t.pages.map((p) => ({ ...p, body: p.body !== undefined ? paragraphsToRich(richToParagraphs(p.body)) : p.body }));
  return t;
}

/* ---------------------------------------------------------------- small form pieces */

function Text({ label, value, onChange, rows, hint, placeholder }: { label: string; value?: string | null; onChange: (v: string) => void; rows?: number; hint?: string; placeholder?: string }) {
  return (
    <label className="ed-field">
      <span className="ed-label">{label}</span>
      {rows ? (
        <textarea rows={rows} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="ed-hint">{hint}</span>}
    </label>
  );
}

function Lines({ label, value, onChange, hint }: { label: string; value?: string[]; onChange: (v: string[]) => void; hint?: string }) {
  return (
    <label className="ed-field">
      <span className="ed-label">{label}</span>
      <textarea rows={Math.min(8, Math.max(2, (value ?? []).length + 1))} value={(value ?? []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
      {hint && <span className="ed-hint">{hint}</span>}
    </label>
  );
}

function Check({ label, value, onChange }: { label: string; value?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ed-check">
      <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Num({ label, value, onChange, min, max, step }: { label: string; value?: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <label className="ed-field ed-num">
      <span className="ed-label">{label}</span>
      <input type="number" value={value ?? 0} min={min} max={max} step={step ?? 1} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Pick<T extends string>({ label, value, options, onChange }: { label: string; value?: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="ed-field">
      <span className="ed-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A titled card. With `fold` it opens and closes, so long lists (cards, questions, books…) stay scannable on a phone. */
function Box({ title, children, fold = false }: { title: string; children: React.ReactNode; fold?: boolean }) {
  if (fold) {
    return (
      <details className="ed-box">
        <summary>{title}</summary>
        {children}
      </details>
    );
  }
  return (
    <section className="ed-box">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="ed-row">{children}</div>;
}

function Move({ index, length, onMove, onRemove }: { index: number; length: number; onMove: (to: number) => void; onRemove?: () => void }) {
  return (
    <div className="ed-move">
      <button type="button" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up">
        ↑
      </button>
      <button type="button" disabled={index === length - 1} onClick={() => onMove(index + 1)} aria-label="Move down">
        ↓
      </button>
      {onRemove && (
        <button type="button" className="ed-danger" onClick={onRemove}>
          Remove
        </button>
      )}
    </div>
  );
}

const TABS = [
  ["company", "Company"],
  ["menu", "Menu & cover"],
  ["sections", "Sections"],
  ["cards", "The 9 cards"],
  ["about", "About"],
  ["values", "Values"],
  ["quiz", "The 9 Quiz"],
  ["enquiry", "Talk to us"],
  ["books", "Books"],
  ["faq", "FAQ"],
  ["pages", "Pages"],
  ["look", "Look & SEO"],
] as const;
type Tab = (typeof TABS)[number][0];

/* ---------------------------------------------------------------- the editor */

export function AdminEditor({ initial }: { initial: Snap }) {
  const [snap, setSnap] = useState<Snap>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [sha, setSha] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [tokenState, setTokenState] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "bad" | "info"; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>("company");
  const [answers, setAnswers] = useState<QuizAnswers>({});

  useEffect(() => {
    try {
      const t = sessionStorage.getItem(TOKEN_KEY) ?? "";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the browser's saved token once, after the page loads
      if (t) setToken(t);
    } catch {
      /* storage blocked: type the token each time */
    }
  }, []);

  const dirty = useMemo(() => JSON.stringify(snap) !== saved, [snap, saved]);
  const edit = (fn: (s: Snap) => void) => setSnap((prev) => {
    const next = structuredClone(prev);
    fn(next);
    return next;
  });

  async function connect(t: string) {
    setBusy(true);
    setNote({ kind: "info", text: "Checking the token…" });
    const check = await checkToken(t);
    setTokenState(check);
    if (!check.ok) {
      setBusy(false);
      setNote({ kind: "bad", text: check.text });
      return;
    }
    try {
      sessionStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* kept for this page only */
    }
    setToken(t);
    try {
      const latest = await loadRemote(t);
      setSnap(latest.data);
      setSaved(JSON.stringify(latest.data));
      setSha(latest.sha);
      setNote({ kind: "ok", text: "Loaded the latest content from the repository." });
    } catch (err) {
      setNote({ kind: "bad", text: err instanceof Error ? err.message : "Could not load the content." });
    }
    setBusy(false);
  }

  async function reload() {
    if (!token) return;
    if (dirty && !window.confirm("Discard your unsaved changes and load the latest saved version?")) return;
    setBusy(true);
    try {
      const latest = await loadRemote(token);
      setSnap(latest.data);
      setSaved(JSON.stringify(latest.data));
      setSha(latest.sha);
      setNote({ kind: "ok", text: "Loaded the latest saved version." });
    } catch (err) {
      setNote({ kind: "bad", text: err instanceof Error ? err.message : "Could not load." });
    }
    setBusy(false);
  }

  async function save() {
    if (!token || !sha) return;
    const message = window.prompt("What did you change? (this becomes the note in the history)", "Edit website content") ?? "";
    if (!message.trim()) return;
    setBusy(true);
    setNote({ kind: "info", text: "Saving…" });
    const body = readyForSave(snap);
    const r = await gh(`/repos/${REPO}/contents/${FILE}`, token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${message.trim()} (website editor)`, content: encodeUtf8(JSON.stringify(body, null, 2) + "\n"), sha, branch: BRANCH }),
    });
    setBusy(false);
    if (r.status === 409 || r.status === 422) {
      setNote({ kind: "bad", text: "Someone saved changes after you opened this page. Use “Load latest” and apply your edits again." });
      return;
    }
    if (!r.ok) {
      setNote({ kind: "bad", text: `Could not save (GitHub ${r.status}). Your changes are still here.` });
      return;
    }
    const j = (await r.json()) as { content: { sha: string } };
    setSha(j.content.sha);
    setSnap(body);
    setSaved(JSON.stringify(body));
    setNote({ kind: "ok", text: "Saved. The website updates in a few minutes (the demo is rebuilt on each save)." });
  }

  function signOut() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing stored */
    }
    setToken("");
    setTokenState(null);
    setSha(null);
    setNote({ kind: "info", text: "Signed out of this browser. Your unsaved changes are still here until you reload." });
  }

  const s = snap.site;
  const q = s.quiz;
  const simulated = scoreQuiz({ services: s.services, quiz: s.quiz }, answers);
  const answered = Object.values(answers).some((a) => a.length);

  return (
    <main className="ed">
      <header className="ed-top">
        <div>
          <p className="ed-kicker">Nine Labs · website editor</p>
          <h1>Edit the website</h1>
          <p className="ed-lead">
            Change the text, cards, quiz and books, then press Save. Each save is recorded in the repository&apos;s history, so any change can be undone. This editor does not handle
            sign-in, e-mail, book requests or PDFs; those stay with the full admin.
          </p>
        </div>
        <a className="ed-link" href={siteHref("/")}>
          View the website ↗
        </a>
      </header>

      <section className="ed-connect">
        {!token || !tokenState?.ok ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = String(new FormData(e.currentTarget).get("token") ?? "").trim();
              if (t) void connect(t);
            }}
          >
            <label className="ed-field">
              <span className="ed-label">GitHub token (kept only in this browser tab)</span>
              <input name="token" type="password" autoComplete="off" placeholder="github_pat_…" />
              <span className="ed-hint">You can look around without one. A token is only needed to save.</span>
            </label>
            <button type="submit" disabled={busy}>
              Connect
            </button>
            <details className="ed-help">
              <summary>How do I get a token?</summary>
              <ol>
                <li>
                  Open{" "}
                  <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">
                    GitHub → New fine-grained token
                  </a>{" "}
                  (sign in as the owner of the repository).
                </li>
                <li>Name it, and choose when it expires (for example 90 days).</li>
                <li>Repository access: “Only select repositories” → {REPO || "this repository"}.</li>
                <li>Permissions → Repository permissions → Contents: “Read and write”.</li>
                <li>Generate the token, copy it, and paste it above.</li>
              </ol>
            </details>
          </form>
        ) : (
          <div className="ed-connected">
            <span>{tokenState.text}</span>
            <button type="button" onClick={reload} disabled={busy}>
              Load latest
            </button>
            <button type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        )}
        {note && <p className={`ed-note ed-${note.kind}`} role="status">{note.text}</p>}
        {!REPO && <p className="ed-note ed-bad">This build has no repository set (NEXT_PUBLIC_EDIT_REPO). Saving is off.</p>}
      </section>

      <nav className="ed-tabs" aria-label="Sections">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" aria-current={tab === key ? "page" : undefined} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="ed-body">
        {tab === "company" && (
          <>
            <Box title="Name and contact">
              <Row>
                <Text label="Company name" value={s.name} onChange={(v) => edit((d) => { d.site.name = v; })} />
                <Text label="Short name" value={s.shortName} onChange={(v) => edit((d) => { d.site.shortName = v; })} />
              </Row>
              <Text label="Type of business" value={s.type} onChange={(v) => edit((d) => { d.site.type = v; })} />
              <Text label="One-line description (footer)" value={s.tagline} onChange={(v) => edit((d) => { d.site.tagline = v; })} />
              <Row>
                <Text label="Location" value={s.location} onChange={(v) => edit((d) => { d.site.location = v; })} />
                <Text label="Map link" value={s.mapUrl} onChange={(v) => edit((d) => { d.site.mapUrl = v; })} />
              </Row>
              <Row>
                <Text label="E-mail" value={s.contact.email} onChange={(v) => edit((d) => { d.site.contact.email = v; })} />
                <Text label="Phone (as shown)" value={s.contact.phone} onChange={(v) => edit((d) => { d.site.contact.phone = v; })} />
              </Row>
            </Box>
            <Box title="WhatsApp">
              <Text label="WhatsApp number" value={s.contact.whatsappNumber} hint="Digits only, with the country code, e.g. 971501234567." onChange={(v) => edit((d) => { d.site.contact.whatsappNumber = v.replace(/\D/g, ""); })} />
              <Text label="Message already typed for the visitor" value={s.contact.whatsappText} rows={2} onChange={(v) => edit((d) => { d.site.contact.whatsappText = v; })} />
              <Row>
                <Text label="Floating button text" value={s.contact.fabLabel} onChange={(v) => edit((d) => { d.site.contact.fabLabel = v; })} />
                <Text label="“Chat on WhatsApp” text" value={s.contact.chatLabel} onChange={(v) => edit((d) => { d.site.contact.chatLabel = v; })} />
              </Row>
              <Check label="Show the floating WhatsApp button" value={s.contact.whatsappFab} onChange={(v) => edit((d) => { d.site.contact.whatsappFab = v; })} />
            </Box>
            <Box title="Social links">
              {s.socials.map((so, i) => (
                <Row key={so.key}>
                  <span className="ed-social">{so.label}</span>
                  <Text label="Address (https://…)" value={so.href} onChange={(v) => edit((d) => { d.site.socials[i].href = v; })} />
                </Row>
              ))}
              <p className="ed-hint">A link shows on the site only when it starts with https://.</p>
            </Box>
            <Box title="Footer">
              <Text label="Copyright line" value={s.footer.copyright} onChange={(v) => edit((d) => { d.site.footer.copyright = v; })} />
              <Row>
                <Text label="Menu column title" value={s.footer.navTitle} onChange={(v) => edit((d) => { d.site.footer.navTitle = v; })} />
                <Text label="Activities column title" value={s.footer.activitiesTitle} onChange={(v) => edit((d) => { d.site.footer.activitiesTitle = v; })} />
              </Row>
              <Row>
                <Text label="Contact column title" value={s.footer.contactTitle} onChange={(v) => edit((d) => { d.site.footer.contactTitle = v; })} />
                <Text label="Pages column title" value={s.footer.pagesTitle} onChange={(v) => edit((d) => { d.site.footer.pagesTitle = v; })} />
              </Row>
            </Box>
          </>
        )}

        {tab === "menu" && (
          <>
            <Box title="Menu links">
              {s.nav.map((n, i) => (
                <Row key={n.id + i}>
                  <Text label="Text" value={n.label} onChange={(v) => edit((d) => { d.site.nav[i].label = v; })} />
                  <Text label="Goes to (#section or /page)" value={n.href} onChange={(v) => edit((d) => { d.site.nav[i].href = v; })} />
                </Row>
              ))}
            </Box>
            <Box title="Highlighted menu button">
              <Row>
                <Text label="Text" value={s.navCta.label} onChange={(v) => edit((d) => { d.site.navCta.label = v; })} />
                <Pick label="What it does" value={s.navCta.action} options={[{ value: "quiz", label: "Opens the quiz" }, { value: "whatsapp", label: "Opens WhatsApp" }, { value: "link", label: "Goes to a link" }]} onChange={(v) => edit((d) => { d.site.navCta.action = v; })} />
              </Row>
            </Box>
            <Box title="Cover (first screen)">
              <Row>
                <Text label="Small line above the headline" value={s.hero.eyebrow} onChange={(v) => edit((d) => { d.site.hero.eyebrow = v; })} />
                <Text label="…extra part (hidden on phones)" value={s.hero.eyebrowExtra} onChange={(v) => edit((d) => { d.site.hero.eyebrowExtra = v; })} />
              </Row>
              <Row>
                <Text label="Headline" value={s.hero.headline} onChange={(v) => edit((d) => { d.site.hero.headline = v; })} />
                <Text label="Highlighted ending" value={s.hero.headlineAccent} onChange={(v) => edit((d) => { d.site.hero.headlineAccent = v; })} />
              </Row>
              <Text label="Text under the headline" value={s.hero.sub} rows={3} onChange={(v) => edit((d) => { d.site.hero.sub = v; })} />
              <Row>
                <Text label="Main button" value={s.hero.primary.label} onChange={(v) => edit((d) => { d.site.hero.primary.label = v; })} />
                <Pick label="Main button does" value={s.hero.primary.action} options={[{ value: "quiz", label: "Opens the quiz" }, { value: "whatsapp", label: "Opens WhatsApp" }, { value: "link", label: "Goes to a link" }]} onChange={(v) => edit((d) => { d.site.hero.primary.action = v; })} />
              </Row>
              <Row>
                <Text label="Second button" value={s.hero.secondary.label} onChange={(v) => edit((d) => { d.site.hero.secondary.label = v; })} />
                <Text label="Second button goes to" value={s.hero.secondary.href} onChange={(v) => edit((d) => { d.site.hero.secondary.href = v; })} />
              </Row>
              <Text label="Small line under the big 9" value={s.hero.caption} onChange={(v) => edit((d) => { d.site.hero.caption = v; })} />
            </Box>
          </>
        )}

        {tab === "sections" && (
          <>
            <Box title="Sections on the homepage (top to bottom)">
              <p className="ed-hint">The cover is always first. Tick a section to show it; use the arrows to change the order.</p>
              {(Object.keys(SECTION_NAMES) as SectionKey[]).map((key) => {
                const on = s.sections.includes(key);
                const i = s.sections.indexOf(key);
                return (
                  <div className="ed-section-row" key={key}>
                    <Check label={SECTION_NAMES[key]} value={on} onChange={(v) => edit((d) => {
                      if (v) d.site.sections.push(key);
                      else d.site.sections = d.site.sections.filter((k) => k !== key);
                    })} />
                    {on && (
                      <Move index={i} length={s.sections.length} onMove={(to) => edit((d) => {
                        const list = d.site.sections;
                        [list[i], list[to]] = [list[to], list[i]];
                      })} />
                    )}
                  </div>
                );
              })}
            </Box>
            <Box title="Closing section (contact)">
              <Row>
                <Text label="Label" value={s.closing.label} onChange={(v) => edit((d) => { d.site.closing.label = v; })} />
                <Text label="Heading" value={s.closing.heading} onChange={(v) => edit((d) => { d.site.closing.heading = v; })} />
                <Text label="Highlighted ending" value={s.closing.accent} onChange={(v) => edit((d) => { d.site.closing.accent = v; })} />
              </Row>
              <Text label="Text" value={s.closing.text} rows={2} onChange={(v) => edit((d) => { d.site.closing.text = v; })} />
              <Row>
                <Text label="Main button" value={s.closing.cta} onChange={(v) => edit((d) => { d.site.closing.cta = v; })} />
                <Text label="Flowing text along the arc" value={s.closing.loop} hint="It repeats; end it with a separator such as ✦." onChange={(v) => edit((d) => { d.site.closing.loop = v; })} />
              </Row>
            </Box>
            <Box title="FAQ preview on the homepage">
              <Check label="Show the first questions on the homepage" value={s.faqPreview.enabled} onChange={(v) => edit((d) => { d.site.faqPreview.enabled = v; })} />
              <Row>
                <Text label="Label" value={s.faqPreview.label} onChange={(v) => edit((d) => { d.site.faqPreview.label = v; })} />
                <Text label="Heading" value={s.faqPreview.heading} onChange={(v) => edit((d) => { d.site.faqPreview.heading = v; })} />
                <Text label="Highlighted ending" value={s.faqPreview.accent} onChange={(v) => edit((d) => { d.site.faqPreview.accent = v; })} />
              </Row>
            </Box>
          </>
        )}

        {tab === "cards" && (
          <>
            <Box title="Section texts">
              <Row>
                <Text label="Label" value={s.servicesSection.label} onChange={(v) => edit((d) => { d.site.servicesSection.label = v; })} />
                <Text label="Heading" value={s.servicesSection.heading} onChange={(v) => edit((d) => { d.site.servicesSection.heading = v; })} />
                <Text label="Highlighted ending" value={s.servicesSection.accent} onChange={(v) => edit((d) => { d.site.servicesSection.accent = v; })} />
              </Row>
              <Text label="Introduction" value={s.servicesSection.intro} rows={2} onChange={(v) => edit((d) => { d.site.servicesSection.intro = v; })} />
              <Row>
                <Text label="Closing line" value={s.servicesSection.outro} onChange={(v) => edit((d) => { d.site.servicesSection.outro = v; })} />
                <Text label="Closing highlighted ending" value={s.servicesSection.outroAccent} onChange={(v) => edit((d) => { d.site.servicesSection.outroAccent = v; })} />
                <Text label="Button on each card" value={s.servicesSection.cardCta} onChange={(v) => edit((d) => { d.site.servicesSection.cardCta = v; })} />
              </Row>
            </Box>
            {s.services.map((c, i) => (
              <Box fold key={c.slug} title={`Card ${c.n} — ${c.short}`}>
                <p className="ed-hint">The number, animation and order are fixed. Their words are editable.</p>
                <Row>
                  <Text label="Title" value={c.title} onChange={(v) => edit((d) => { d.site.services[i].title = v; })} />
                  <Text label="Short name" value={c.short} onChange={(v) => edit((d) => { d.site.services[i].short = v; })} />
                </Row>
                <Text label="Description" value={c.description} rows={2} onChange={(v) => edit((d) => { d.site.services[i].description = v; })} />
                <Row>
                  <Lines label="Three keywords (one per line)" value={c.tags} onChange={(v) => edit((d) => { d.site.services[i].tags = v; })} />
                  <Lines label="“What do you need?” choices (one per line)" value={c.needs} onChange={(v) => edit((d) => { d.site.services[i].needs = v; })} />
                </Row>
                <Text label="Enquiries for this card go to (optional WhatsApp number)" value={c.whatsappNumber ?? ""} onChange={(v) => edit((d) => { d.site.services[i].whatsappNumber = v.replace(/\D/g, "") || undefined; })} />
              </Box>
            ))}
          </>
        )}

        {tab === "about" && (
          <>
            <Box title="About">
              <Row>
                <Text label="Section label" value={s.about.label} onChange={(v) => edit((d) => { d.site.about.label = v; })} />
                <Text label="Strip line under the numbers" value={s.about.strip} onChange={(v) => edit((d) => { d.site.about.strip = v; })} />
              </Row>
              <Text label="Big statement" value={s.about.statement} rows={2} onChange={(v) => edit((d) => { d.site.about.statement = v; })} />
              <Text label="About text" value={s.about.body} rows={4} onChange={(v) => edit((d) => { d.site.about.body = v; })} />
              <Text label="Quote" value={s.about.philosophy} rows={2} onChange={(v) => edit((d) => { d.site.about.philosophy = v; })} />
            </Box>
            <Box title="Numbers">
              {s.about.stats.map((st, i) => (
                <Row key={i}>
                  <Num label="Number" value={st.value} onChange={(v) => edit((d) => { d.site.about.stats[i].value = v; })} />
                  <Text label="Label" value={st.label} onChange={(v) => edit((d) => { d.site.about.stats[i].label = v; })} />
                </Row>
              ))}
            </Box>
            <Box title="“How we work” — the bridge">
              <Row>
                <Text label="Label" value={s.about.story.label} onChange={(v) => edit((d) => { d.site.about.story.label = v; })} />
                <Text label="Heading" value={s.about.story.heading} onChange={(v) => edit((d) => { d.site.about.story.heading = v; })} />
                <Text label="Highlighted ending" value={s.about.story.accent} onChange={(v) => edit((d) => { d.site.about.story.accent = v; })} />
              </Row>
              <Row>
                <Text label="Left bank — label" value={s.about.story.yourSideLabel} onChange={(v) => edit((d) => { d.site.about.story.yourSideLabel = v; })} />
                <Text label="Left bank — title" value={s.about.story.yourSideTitle} onChange={(v) => edit((d) => { d.site.about.story.yourSideTitle = v; })} />
                <Lines label="Left bank — chips" value={s.about.story.yourSideChips} onChange={(v) => edit((d) => { d.site.about.story.yourSideChips = v; })} />
              </Row>
              <Row>
                <Text label="Right bank — label" value={s.about.story.ourSideLabel} onChange={(v) => edit((d) => { d.site.about.story.ourSideLabel = v; })} />
                <Text label="Right bank — title" value={s.about.story.ourSideTitle} onChange={(v) => edit((d) => { d.site.about.story.ourSideTitle = v; })} />
                <Text label="Middle stop (phone)" value={s.about.story.middleLabel} onChange={(v) => edit((d) => { d.site.about.story.middleLabel = v; })} />
              </Row>
              <Row>
                <Text label="Moving label, left→right" value={s.about.story.pillOut} hint="About 14 characters." onChange={(v) => edit((d) => { d.site.about.story.pillOut = v; })} />
                <Text label="Moving label, right→left" value={s.about.story.pillIn} onChange={(v) => edit((d) => { d.site.about.story.pillIn = v; })} />
                <Text label="Result badge" value={s.about.story.result} onChange={(v) => edit((d) => { d.site.about.story.result = v; })} />
              </Row>
              {s.about.steps.map((st, i) => (
                <Box fold key={i} title={`Step ${i + 1}: ${st.title}`}>
                  <Row>
                    <Text label="Number" value={st.n} onChange={(v) => edit((d) => { d.site.about.steps[i].n = v; })} />
                    <Text label="Title" value={st.title} onChange={(v) => edit((d) => { d.site.about.steps[i].title = v; })} />
                  </Row>
                  <Text label="Text" value={st.text} rows={2} onChange={(v) => edit((d) => { d.site.about.steps[i].text = v; })} />
                </Box>
              ))}
            </Box>
          </>
        )}

        {tab === "values" && (
          <>
            <Box title="Values (five cards in the About section)">
              <p className="ed-hint">The icon for each value is fixed; the words are editable.</p>
            </Box>
            {s.values.map((v, i) => (
              <Box fold key={v.key + i} title={`${i + 1}. ${v.title}`}>
                <Text label="Title" value={v.title} onChange={(x) => edit((d) => { d.site.values[i].title = x; })} />
                <Text label="Text" value={v.line} rows={2} onChange={(x) => edit((d) => { d.site.values[i].line = x; })} />
              </Box>
            ))}
            <Box title="Values heading">
              <Row>
                <Text label="Label" value={s.about.valuesLabel} onChange={(v) => edit((d) => { d.site.about.valuesLabel = v; })} />
                <Text label="Heading" value={s.about.valuesHeading} onChange={(v) => edit((d) => { d.site.about.valuesHeading = v; })} />
              </Row>
              <Text label="Introduction" value={s.about.valuesIntro} rows={2} onChange={(v) => edit((d) => { d.site.about.valuesIntro = v; })} />
            </Box>
          </>
        )}

        {tab === "quiz" && (
          <>
            <Box title="Quiz section on the homepage">
              <Row>
                <Text label="Label" value={q.label} onChange={(v) => edit((d) => { d.site.quiz.label = v; })} />
                <Text label="Heading" value={q.heading} onChange={(v) => edit((d) => { d.site.quiz.heading = v; })} />
                <Text label="Highlighted ending" value={q.accent} onChange={(v) => edit((d) => { d.site.quiz.accent = v; })} />
              </Row>
              <Text label="Text" value={q.text} rows={2} onChange={(v) => edit((d) => { d.site.quiz.text = v; })} />
              <Row>
                <Text label="Button" value={q.cta} onChange={(v) => edit((d) => { d.site.quiz.cta = v; })} />
                <Text label="Small line under the button ({count} = number of questions)" value={q.meta} onChange={(v) => edit((d) => { d.site.quiz.meta = v; })} />
              </Row>
            </Box>
            <Box title="How the points work">
              <p className="ed-hint">
                Each answer gives points to activities (0 = none, 3 = strong). The three activities with the most points are recommended, with a match percentage. Mark one question as “who”, one as “goal” and one as “timing”: the result&apos;s opening sentence uses those answers.
              </p>
            </Box>
            {q.questions.map((qu, qi) => (
              <Box fold key={qu.id + qi} title={`${qi + 1}. ${qu.q}`}>
                <Move
                  index={qi}
                  length={q.questions.length}
                  onMove={(to) => edit((d) => {
                    const list = d.site.quiz.questions;
                    [list[qi], list[to]] = [list[to], list[qi]];
                  })}
                  onRemove={q.questions.length > 1 ? () => edit((d) => { d.site.quiz.questions.splice(qi, 1); }) : undefined}
                />
                <Text label="Question" value={qu.q} onChange={(v) => edit((d) => { d.site.quiz.questions[qi].q = v; })} />
                <Row>
                  <Text label="Short name (used in the WhatsApp summary)" value={qu.label} onChange={(v) => edit((d) => { d.site.quiz.questions[qi].label = v; })} />
                  <Pick<"none" | "who" | "goal" | "when">
                    label="Used in the result sentence as"
                    value={qu.role ?? "none"}
                    options={[{ value: "none", label: "— not used —" }, { value: "who", label: "Who they are" }, { value: "goal", label: "Their main goal" }, { value: "when", label: "Their timing" }]}
                    onChange={(v) => edit((d) => { d.site.quiz.questions[qi].role = v === "none" ? undefined : v; })}
                  />
                  <Check label="Several answers allowed" value={qu.multi} onChange={(v) => edit((d) => { d.site.quiz.questions[qi].multi = v; })} />
                </Row>
                <Text label="Hint under the question (optional)" value={qu.hint ?? ""} onChange={(v) => edit((d) => { d.site.quiz.questions[qi].hint = v || undefined; })} />
                {qu.options.map((o, oi) => (
                  <div className="ed-option" key={o.id + oi}>
                    <Text label={`Answer ${oi + 1}`} value={o.label} onChange={(v) => edit((d) => { d.site.quiz.questions[qi].options[oi].label = v; })} />
                    <div className="ed-points">
                      {ACTIVITIES.map((a) => (
                        <Num key={a} label={ACTIVITY_NAMES[a]} min={0} max={5} value={o.weights[a] ?? 0} onChange={(v) => edit((d) => {
                          const w = d.site.quiz.questions[qi].options[oi].weights;
                          if (v > 0) w[a] = Math.min(5, Math.round(v));
                          else delete w[a];
                        })} />
                      ))}
                    </div>
                    <Check label="Stands alone (e.g. “Nothing yet”)" value={o.only} onChange={(v) => edit((d) => { d.site.quiz.questions[qi].options[oi].only = v || undefined; })} />
                    {qu.options.length > 2 && (
                      <button type="button" className="ed-danger" onClick={() => edit((d) => { d.site.quiz.questions[qi].options.splice(oi, 1); })}>
                        Remove this answer
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="ed-add" onClick={() => edit((d) => {
                  const id = `${d.site.quiz.questions[qi].id}-${Date.now().toString(36)}`;
                  d.site.quiz.questions[qi].options.push({ id, label: "New answer", weights: {} });
                })}>
                  Add an answer
                </button>
              </Box>
            ))}
            <button type="button" className="ed-add" onClick={() => edit((d) => {
              const n = d.site.quiz.questions.length + 1;
              d.site.quiz.questions.push({
                id: `q${Date.now().toString(36)}`,
                label: `Question ${n}`,
                q: "New question",
                multi: false,
                options: [
                  { id: `a${Date.now().toString(36)}1`, label: "Answer 1", weights: {} },
                  { id: `a${Date.now().toString(36)}2`, label: "Answer 2", weights: {} },
                ],
              });
            })}>
              Add a question
            </button>

            <Box title="Result screen">
              <Row>
                <Text label="Label" value={q.result.label} onChange={(v) => edit((d) => { d.site.quiz.result.label = v; })} />
                <Text label="Heading" value={q.result.heading} onChange={(v) => edit((d) => { d.site.quiz.result.heading = v; })} />
              </Row>
              <Text label="Opening sentence ({who} {goal} {when})" value={q.result.summary} rows={2} onChange={(v) => edit((d) => { d.site.quiz.result.summary = v; })} />
              <Text label="“Why” line ({answers})" value={q.result.why} onChange={(v) => edit((d) => { d.site.quiz.result.why = v; })} />
              <Num label="How many activities to recommend" min={1} max={5} value={q.result.matches} onChange={(v) => edit((d) => { d.site.quiz.result.matches = v; })} />
              {q.result.steps.map((st, i) => (
                <Box fold key={i} title={`Plan step ${i + 1}: ${st.title}`}>
                  <Text label="Title ({first} {next})" value={st.title} onChange={(v) => edit((d) => { d.site.quiz.result.steps[i].title = v; })} />
                  <Text label="Text ({firstDescription} {next})" value={st.text} rows={2} onChange={(v) => edit((d) => { d.site.quiz.result.steps[i].text = v; })} />
                </Box>
              ))}
              <Row>
                <Text label="WhatsApp button" value={q.result.whatsappCta} onChange={(v) => edit((d) => { d.site.quiz.result.whatsappCta = v; })} />
                <Text label="Retake link" value={q.result.retake} onChange={(v) => edit((d) => { d.site.quiz.result.retake = v; })} />
                <Text label="E-books link" value={q.result.ebooksCta} onChange={(v) => edit((d) => { d.site.quiz.result.ebooksCta = v; })} />
              </Row>
              <Row>
                <Text label="WhatsApp message — first line" value={q.result.whatsappIntro} onChange={(v) => edit((d) => { d.site.quiz.result.whatsappIntro = v; })} />
                <Text label="WhatsApp message — last line" value={q.result.whatsappOutro} onChange={(v) => edit((d) => { d.site.quiz.result.whatsappOutro = v; })} />
              </Row>
              <Check label="Offer “e-mail me this plan”" value={q.result.emailEnabled} onChange={(v) => edit((d) => { d.site.quiz.result.emailEnabled = v; })} />
              <Row>
                <Text label="E-mail box hint" value={q.result.emailPlaceholder} onChange={(v) => edit((d) => { d.site.quiz.result.emailPlaceholder = v; })} />
                <Text label="E-mail button" value={q.result.emailCta} onChange={(v) => edit((d) => { d.site.quiz.result.emailCta = v; })} />
              </Row>
            </Box>

            <Box title="Try it: what would the visitor see?">
              <p className="ed-hint">Pick answers as a visitor would. This uses the same scoring as the site.</p>
              {q.questions.map((qu) => (
                <fieldset className="ed-try" key={qu.id}>
                  <legend>{qu.q}</legend>
                  {qu.options.map((o) => {
                    const on = (answers[qu.id] ?? []).includes(o.id);
                    return (
                      <button key={o.id} type="button" aria-pressed={on} className={on ? "is-on" : ""} onClick={() => setAnswers((a) => {
                        const cur = a[qu.id] ?? [];
                        if (!qu.multi) return { ...a, [qu.id]: cur[0] === o.id ? [] : [o.id] };
                        return { ...a, [qu.id]: cur.includes(o.id) ? cur.filter((x) => x !== o.id) : [...cur, o.id] };
                      })}>
                        {o.label}
                      </button>
                    );
                  })}
                </fieldset>
              ))}
              {answered ? (
                <div className="ed-result">
                  <p>{simulated.summary}</p>
                  <ol>
                    {simulated.matches.map((m) => (
                      <li key={m.service.slug}>
                        <strong>
                          {m.service.title} — {m.score}%
                        </strong>
                        <span>{m.why}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <p className="ed-hint">Pick some answers to see the result.</p>
              )}
            </Box>
          </>
        )}

        {tab === "enquiry" && (
          <>
            <Box title="Talk-to-us window">
              <Row>
                <Text label="Window title" value={s.enquiry.title} onChange={(v) => edit((d) => { d.site.enquiry.title = v; })} />
                <Text label="Line under the title" value={s.enquiry.intro} onChange={(v) => edit((d) => { d.site.enquiry.intro = v; })} />
              </Row>
              <Row>
                <Lines label="Budget choices (one per line)" value={s.enquiry.budgets} onChange={(v) => edit((d) => { d.site.enquiry.budgets = v; })} />
                <Lines label="Timeline choices (one per line)" value={s.enquiry.timelines} onChange={(v) => edit((d) => { d.site.enquiry.timelines = v; })} />
              </Row>
              <Row>
                <Check label="Ask for a budget" value={s.enquiry.showBudget} onChange={(v) => edit((d) => { d.site.enquiry.showBudget = v; })} />
                <Check label="Ask for a timeline" value={s.enquiry.showTimeline} onChange={(v) => edit((d) => { d.site.enquiry.showTimeline = v; })} />
                <Check label="Ask for a company" value={s.enquiry.showCompany} onChange={(v) => edit((d) => { d.site.enquiry.showCompany = v; })} />
                <Check label="Allow a message" value={s.enquiry.showMessage} onChange={(v) => edit((d) => { d.site.enquiry.showMessage = v; })} />
              </Row>
              <Row>
                <Text label="Activity label" value={s.enquiry.activityLabel} onChange={(v) => edit((d) => { d.site.enquiry.activityLabel = v; })} />
                <Text label="Needs label" value={s.enquiry.needsLabel} onChange={(v) => edit((d) => { d.site.enquiry.needsLabel = v; })} />
                <Text label="Budget label" value={s.enquiry.budgetLabel} onChange={(v) => edit((d) => { d.site.enquiry.budgetLabel = v; })} />
                <Text label="Timeline label" value={s.enquiry.timelineLabel} onChange={(v) => edit((d) => { d.site.enquiry.timelineLabel = v; })} />
              </Row>
              <Row>
                <Text label="Name label" value={s.enquiry.nameLabel} onChange={(v) => edit((d) => { d.site.enquiry.nameLabel = v; })} />
                <Text label="Missing name message" value={s.enquiry.nameError} onChange={(v) => edit((d) => { d.site.enquiry.nameError = v; })} />
                <Text label="Company label" value={s.enquiry.companyLabel} onChange={(v) => edit((d) => { d.site.enquiry.companyLabel = v; })} />
                <Text label="Message label" value={s.enquiry.messageLabel} onChange={(v) => edit((d) => { d.site.enquiry.messageLabel = v; })} />
              </Row>
              <Row>
                <Text label="WhatsApp button" value={s.enquiry.whatsappCta} onChange={(v) => edit((d) => { d.site.enquiry.whatsappCta = v; })} />
                <Check label="Offer “e-mail instead”" value={s.enquiry.emailEnabled} onChange={(v) => edit((d) => { d.site.enquiry.emailEnabled = v; })} />
                <Text label="E-mail link" value={s.enquiry.emailCta} onChange={(v) => edit((d) => { d.site.enquiry.emailCta = v; })} />
              </Row>
            </Box>
            <Box title="WhatsApp message and thank-you">
              <Row>
                <Text label="First line of the message" value={s.enquiry.greeting} onChange={(v) => edit((d) => { d.site.enquiry.greeting = v; })} />
                <Text label="Last line of the message" value={s.enquiry.signature} onChange={(v) => edit((d) => { d.site.enquiry.signature = v; })} />
              </Row>
              <Text label="Thank-you title ({name})" value={s.enquiry.thanksTitle} onChange={(v) => edit((d) => { d.site.enquiry.thanksTitle = v; })} />
              <Text label="Thank-you text" value={s.enquiry.thanksText} rows={2} onChange={(v) => edit((d) => { d.site.enquiry.thanksText = v; })} />
              <Text label="“Open WhatsApp again” button" value={s.enquiry.again} onChange={(v) => edit((d) => { d.site.enquiry.again = v; })} />
            </Box>
          </>
        )}

        {tab === "books" && (
          <>
            <Box title="Books on the shelf">
              <p className="ed-hint">Books are edited here; adding or deleting a book, and PDFs, are done in the full admin. Each book keeps its own page.</p>
            </Box>
            {s.ebooks.map((b, i) => (
              <Box fold key={b.slug} title={`${b.n} — ${b.title}`}>
                <Move index={i} length={s.ebooks.length} onMove={(to) => edit((d) => {
                  const list = d.site.ebooks;
                  [list[i], list[to]] = [list[to], list[i]];
                })} />
                <Row>
                  <Text label="Title" value={b.title} onChange={(v) => edit((d) => { d.site.ebooks[i].title = v; })} />
                  <Text label="Subtitle" value={b.subtitle} onChange={(v) => edit((d) => { d.site.ebooks[i].subtitle = v; })} />
                </Row>
                <Text label="One-line description" value={b.oneLiner} rows={2} onChange={(v) => edit((d) => { d.site.ebooks[i].oneLiner = v; })} />
                <Row>
                  <Lines label="Chapters (one per line)" value={b.chapters} onChange={(v) => edit((d) => { d.site.ebooks[i].chapters = v; })} />
                  <Num label="Pages" value={b.pages} min={1} onChange={(v) => edit((d) => { d.site.ebooks[i].pages = v; })} />
                  <Text label="Reading time" value={b.readTime} onChange={(v) => edit((d) => { d.site.ebooks[i].readTime = v; })} />
                </Row>
                <Row>
                  <Pick label="Cover colour" value={b.tone} options={[{ value: "blue", label: "Blue" }, { value: "purple", label: "Purple" }, { value: "duo", label: "Blue to purple" }]} onChange={(v) => edit((d) => { d.site.ebooks[i].tone = v; })} />
                  <Text label="Cover image (web address, optional)" value={b.cover ?? ""} onChange={(v) => edit((d) => { d.site.ebooks[i].cover = v || undefined; })} />
                </Row>
              </Box>
            ))}
          </>
        )}

        {tab === "faq" && (
          <>
            <Box title="Questions and answers">
              <p className="ed-hint">Leave an empty line between paragraphs in an answer. Questions with the same group are shown together.</p>
            </Box>
            {snap.faqs.map((f, i) => (
              <Box fold key={f.id} title={`${i + 1}. ${f.question}`}>
                <Move index={i} length={snap.faqs.length} onMove={(to) => edit((d) => {
                  const list = d.faqs;
                  [list[i], list[to]] = [list[to], list[i]];
                })} onRemove={() => edit((d) => { d.faqs.splice(i, 1); })} />
                <Text label="Question" value={f.question} onChange={(v) => edit((d) => { d.faqs[i].question = v; })} />
                <Text label="Answer" value={f.answerText} rows={4} onChange={(v) => edit((d) => { d.faqs[i].answerText = v; })} />
                <Text label="Group (optional)" value={f.category ?? ""} onChange={(v) => edit((d) => { d.faqs[i].category = v || undefined; })} />
              </Box>
            ))}
            <button type="button" className="ed-add" onClick={() => edit((d) => { d.faqs.push({ id: `f${Date.now().toString(36)}`, question: "New question", answerText: "Answer", answerHtml: "", category: "" }); })}>
              Add a question
            </button>
          </>
        )}

        {tab === "pages" && (
          <>
            <Box title="Pages (About, FAQ introduction, Privacy)">
              <p className="ed-hint">Paragraphs are separated by an empty line. The extra blocks show parts of the homepage on that page.</p>
            </Box>
            {snap.pages.map((p, i) => (
              <Box fold key={p.slug} title={`${p.title} (/${p.slug})`}>
                <Row>
                  <Text label="Title" value={p.title} onChange={(v) => edit((d) => { d.pages[i].title = v; })} />
                  <Text label="Small label above the title" value={p.eyebrow ?? ""} onChange={(v) => edit((d) => { d.pages[i].eyebrow = v; })} />
                </Row>
                <Text label="Introduction" value={p.intro ?? ""} rows={2} onChange={(v) => edit((d) => { d.pages[i].intro = v; })} />
                <Text label="Page text" value={richToParagraphs(p.body)} rows={6} onChange={(v) => edit((d) => { d.pages[i].body = paragraphsToRich(v); })} />
                <Row>
                  <Check label="The three numbers" value={p.showStats} onChange={(v) => edit((d) => { d.pages[i].showStats = v; })} />
                  <Check label="The three steps" value={p.showSteps} onChange={(v) => edit((d) => { d.pages[i].showSteps = v; })} />
                  <Check label="The value cards" value={p.showValues} onChange={(v) => edit((d) => { d.pages[i].showValues = v; })} />
                  <Check label="The nine cards" value={p.showServices} onChange={(v) => edit((d) => { d.pages[i].showServices = v; })} />
                  <Check label="Quiz and WhatsApp buttons at the end" value={p.showCta !== false} onChange={(v) => edit((d) => { d.pages[i].showCta = v; })} />
                </Row>
                <Row>
                  <Text label="Title in Google (optional)" value={p.seo?.title ?? ""} onChange={(v) => edit((d) => { d.pages[i].seo = { ...(d.pages[i].seo ?? {}), title: v || null }; })} />
                  <Text label="Description in Google (optional)" value={p.seo?.description ?? ""} onChange={(v) => edit((d) => { d.pages[i].seo = { ...(d.pages[i].seo ?? {}), description: v || null }; })} />
                </Row>
              </Box>
            ))}
          </>
        )}

        {tab === "look" && (
          <>
            <Box title="Look">
              <Row>
                <Pick label="Theme a new visitor sees" value={s.theme.default} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} onChange={(v) => edit((d) => { d.site.theme.default = v; })} />
                <Check label="Visitors can switch light / dark" value={s.theme.toggle} onChange={(v) => edit((d) => { d.site.theme.toggle = v; })} />
                <Check label="Play the logo animation on a first visit" value={s.theme.intro} onChange={(v) => edit((d) => { d.site.theme.intro = v; })} />
              </Row>
              <Num label="Background grid strength (0 to 0.2)" min={0} max={0.2} step={0.01} value={s.theme.grid} onChange={(v) => edit((d) => { d.site.theme.grid = v; })} />
              <p className="ed-hint">Brand colours: leave empty to keep the built-in colour. Use #rrggbb.</p>
              <Row>
                <Text label="Main colour (light)" value={s.theme.colors.blue ?? ""} onChange={(v) => edit((d) => { d.site.theme.colors.blue = v || undefined; })} />
                <Text label="Accent (light)" value={s.theme.colors.purple ?? ""} onChange={(v) => edit((d) => { d.site.theme.colors.purple = v || undefined; })} />
                <Text label="Background (light)" value={s.theme.colors.bg ?? ""} onChange={(v) => edit((d) => { d.site.theme.colors.bg = v || undefined; })} />
              </Row>
              <Row>
                <Text label="Gradient start (logo)" value={s.theme.colors.logoFrom ?? ""} onChange={(v) => edit((d) => { d.site.theme.colors.logoFrom = v || undefined; })} />
                <Text label="Gradient end (logo)" value={s.theme.colors.logoTo ?? ""} onChange={(v) => edit((d) => { d.site.theme.colors.logoTo = v || undefined; })} />
                <Text label="Background (dark)" value={s.theme.colors.darkBg ?? ""} onChange={(v) => edit((d) => { d.site.theme.colors.darkBg = v || undefined; })} />
              </Row>
            </Box>
            <Box title="Google and sharing">
              <Text label="Homepage title" value={s.seo.title} onChange={(v) => edit((d) => { d.site.seo.title = v; })} />
              <Text label="Title of other pages (%s = the page's title)" value={s.seo.titleTemplate} onChange={(v) => edit((d) => { d.site.seo.titleTemplate = v; })} />
              <Text label="Description" value={s.seo.description} rows={3} onChange={(v) => edit((d) => { d.site.seo.description = v; })} />
              <Lines label="Keywords (one per line)" value={s.seo.keywords} onChange={(v) => edit((d) => { d.site.seo.keywords = v; })} />
              <Check label="Allow search engines to list the site" value={s.seo.index} onChange={(v) => edit((d) => { d.site.seo.index = v; })} />
            </Box>
          </>
        )}
      </div>

      <footer className="ed-save">
        <span className={dirty ? "ed-dirty" : "ed-clean"}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button type="button" onClick={reload} disabled={busy || !token || !tokenState?.ok}>
          Discard and reload
        </button>
        <button type="button" className="ed-primary" onClick={save} disabled={busy || !dirty || !token || !tokenState?.ok || !sha || !REPO}>
          Save to the website
        </button>
      </footer>
    </main>
  );
}
