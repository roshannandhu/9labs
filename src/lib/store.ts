"use client";

import { defaultWorkspace, WORKSPACE_SCHEMA } from "@/content/defaults";
import type { AdminRole, AdminUser, BookRequest, Enquiry, FollowUp, OutboxKind, OutboxMail, QuizResult, Version, Workspace } from "@/content/types";
import { diffDeep } from "./diff";
import { getIn, insertIntoArray, moveInArray, removeFromArray, setIn, type Path } from "./path";
import { seedSampleData } from "./sample";

export type Session = { email: string; role: AdminRole } | null;

export type StoreState = {
  draft: Workspace;
  published: Workspace;
  versions: Version[];
  enquiries: Enquiry[];
  bookRequests: BookRequest[];
  quizResults: QuizResult[];
  outbox: OutboxMail[];
  admins: AdminUser[];
  session: Session;
};

const KEY = "nl-studio-v1";
const MAX_VERSIONS = 30;
const MAX_UNDO = 60;

function freshState(): StoreState {
  const ws = defaultWorkspace();
  const owner: AdminUser = { id: "owner-1", email: "owner@ninelabs.example", name: "Owner", role: "owner", active: true, lastLoginAt: null };
  const base: StoreState = {
    draft: ws,
    published: structuredClone(ws),
    versions: [],
    enquiries: [],
    bookRequests: [],
    quizResults: [],
    outbox: [],
    admins: [owner],
    session: null,
  };
  return seedSampleData(base);
}

/** Lays a freshly loaded workspace over today's defaults, so an older save never crashes a newer build. */
function normalizeWorkspace(saved: unknown): Workspace {
  const d = defaultWorkspace();
  if (!saved || typeof saved !== "object") return d;
  const s = saved as Partial<Workspace>;
  return {
    schema: WORKSPACE_SCHEMA,
    site: deepMerge(d.site, s.site),
    pages: Array.isArray(s.pages) && s.pages.length ? (s.pages as Workspace["pages"]) : d.pages,
    faqs: Array.isArray(s.faqs) ? (s.faqs as Workspace["faqs"]) : d.faqs,
    delivery: { ...d.delivery, ...(s.delivery ?? {}) },
    email: { ...d.email, ...(s.email ?? {}) },
  };
}

function deepMerge<T>(def: T, saved: unknown): T {
  if (saved === undefined || saved === null) return def;
  if (Array.isArray(def)) return (Array.isArray(saved) ? saved : def) as T;
  if (def !== null && typeof def === "object") {
    if (typeof saved !== "object" || saved === null) return def;
    const out: Record<string, unknown> = { ...(def as Record<string, unknown>) };
    const savedObj = saved as Record<string, unknown>;
    for (const k of new Set([...Object.keys(out), ...Object.keys(savedObj)])) out[k] = deepMerge(out[k], savedObj[k]);
    return out as T;
  }
  return (saved as T) ?? def;
}

function loadState(): StoreState {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      draft: normalizeWorkspace(parsed.draft),
      published: normalizeWorkspace(parsed.published),
      versions: Array.isArray(parsed.versions) ? parsed.versions : [],
      enquiries: Array.isArray(parsed.enquiries) ? parsed.enquiries : [],
      bookRequests: Array.isArray(parsed.bookRequests) ? parsed.bookRequests : [],
      quizResults: Array.isArray(parsed.quizResults) ? parsed.quizResults : [],
      outbox: Array.isArray(parsed.outbox) ? parsed.outbox : [],
      admins: Array.isArray(parsed.admins) && parsed.admins.length ? parsed.admins : freshState().admins,
      session: parsed.session ?? null,
    };
  } catch {
    return freshState();
  }
}

let state: StoreState = loadState();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function persist() {
  if (typeof window === "undefined") return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.error("[store] could not save — the browser's storage may be full.", err);
    }
  }, 150);
}

function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  persist();
  for (const l of listeners) l();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getState(): StoreState {
  return state;
}

/**
 * A deterministic, signed-out placeholder — never the real (localStorage-derived) state, even on
 * the client. There is no server to render admin content at request time, so every admin screen
 * must render identically on the server and on the client's first paint (both "signed out"); only
 * after hydration does `useStoreState` (`src/studio/state.ts`) swap to the real `getState()`, via
 * `useSyncExternalStore`'s dedicated server-snapshot argument — exactly what it's for.
 */
const EMPTY_SNAPSHOT: StoreState = { draft: defaultWorkspace(), published: defaultWorkspace(), versions: [], enquiries: [], bookRequests: [], quizResults: [], outbox: [], admins: [], session: null };
export function getServerSnapshot(): StoreState {
  return EMPTY_SNAPSHOT;
}

/* ------------------------------------------------------------------ */
/*  Draft editing — one generic mechanism for every field and list   */
/* ------------------------------------------------------------------ */

export function setDraft(path: Path, value: unknown) {
  setState({ draft: setIn(state.draft, path, value) });
}
export function moveDraftItem(path: Path, from: number, to: number) {
  checkpoint();
  const arr = (getIn(state.draft, path) as unknown[]) ?? [];
  setState({ draft: setIn(state.draft, path, moveInArray(arr, from, to)) });
}
export function addDraftItem(path: Path, item: unknown, at?: number) {
  checkpoint();
  const arr = (getIn(state.draft, path) as unknown[]) ?? [];
  const next = at === undefined ? [...arr, item] : insertIntoArray(arr, at, item);
  setState({ draft: setIn(state.draft, path, next) });
}
export function removeDraftItem(path: Path, index: number) {
  checkpoint();
  const arr = (getIn(state.draft, path) as unknown[]) ?? [];
  setState({ draft: setIn(state.draft, path, removeFromArray(arr, index)) });
}

/* ------------------------------------------------------------------ */
/*  Undo / redo for the current editing session (not persisted)        */
/* ------------------------------------------------------------------ */

let undoStack: Workspace[] = [];
let redoStack: Workspace[] = [];

/** Call before a discrete edit (a list move/add/remove, or a field losing focus) to make it undoable. */
export function checkpoint() {
  undoStack.push(state.draft);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack = [];
}
export function canUndo() {
  return undoStack.length > 0;
}
export function canRedo() {
  return redoStack.length > 0;
}
export function undo() {
  const prev = undoStack.pop();
  if (!prev) return;
  redoStack.push(state.draft);
  setState({ draft: prev });
}
export function redo() {
  const next = redoStack.pop();
  if (!next) return;
  undoStack.push(state.draft);
  setState({ draft: next });
}

/* ------------------------------------------------------------------ */
/*  Publish lifecycle                                                   */
/* ------------------------------------------------------------------ */

export function pendingChangeCount(): number {
  return diffDeep(state.published, state.draft).length;
}
export function hasUnpublishedChanges(): boolean {
  return pendingChangeCount() > 0;
}

function pushVersion(workspace: Workspace, summary: string[]) {
  const version: Version = { id: `v_${Date.now().toString(36)}`, at: new Date().toISOString(), summary, workspace: structuredClone(workspace) };
  const versions = [version, ...state.versions].slice(0, MAX_VERSIONS);
  return versions;
}

export function publish(summary: string[]) {
  const versions = pushVersion(state.draft, summary);
  setState({ published: structuredClone(state.draft), versions });
}
export function discardDraft() {
  undoStack = [];
  redoStack = [];
  setState({ draft: structuredClone(state.published) });
}
export function restoreVersion(id: string) {
  const v = state.versions.find((x) => x.id === id);
  if (!v) return;
  const restored = structuredClone(v.workspace);
  const versions = pushVersion(restored, [`Restored the version from ${new Date(v.at).toLocaleString()}`]);
  undoStack = [];
  redoStack = [];
  setState({ draft: restored, published: structuredClone(restored), versions });
}

/* ------------------------------------------------------------------ */
/*  Leads                                                               */
/* ------------------------------------------------------------------ */

const newId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function addEnquiry(e: Omit<Enquiry, "id" | "createdAt" | "status" | "notes">): Enquiry {
  const full: Enquiry = { ...e, id: newId("enq"), status: "new", notes: "", createdAt: new Date().toISOString() };
  setState({ enquiries: [full, ...state.enquiries] });
  return full;
}
export function addBookRequest(r: Omit<BookRequest, "id" | "createdAt">): BookRequest {
  const full: BookRequest = { ...r, id: newId("req"), createdAt: new Date().toISOString() };
  setState({ bookRequests: [full, ...state.bookRequests] });
  return full;
}
export function updateBookRequest(id: string, patch: Partial<BookRequest>) {
  setState({ bookRequests: state.bookRequests.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
}
export function addQuizResult(r: Omit<QuizResult, "id" | "createdAt" | "status" | "notes">): QuizResult {
  const full: QuizResult = { ...r, id: newId("quiz"), status: "new", notes: "", createdAt: new Date().toISOString() };
  setState({ quizResults: [full, ...state.quizResults] });
  return full;
}
export function updateQuizResult(id: string, patch: Partial<QuizResult>) {
  setState({ quizResults: state.quizResults.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
}
export function updateEnquiry(id: string, patch: Partial<Enquiry>) {
  setState({ enquiries: state.enquiries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
}
export function setFollowUp(kind: "enquiry" | "book" | "quiz", id: string, status: FollowUp) {
  if (kind === "enquiry") updateEnquiry(id, { status });
  else if (kind === "quiz") updateQuizResult(id, { status });
}
export function removeLead(kind: "enquiry" | "book" | "quiz", id: string) {
  if (kind === "enquiry") setState({ enquiries: state.enquiries.filter((e) => e.id !== id) });
  else if (kind === "book") setState({ bookRequests: state.bookRequests.filter((r) => r.id !== id) });
  else setState({ quizResults: state.quizResults.filter((r) => r.id !== id) });
}

/* ------------------------------------------------------------------ */
/*  Outbox                                                              */
/* ------------------------------------------------------------------ */

export function addOutboxMail(m: Omit<OutboxMail, "id" | "createdAt">): OutboxMail {
  const full: OutboxMail = { ...m, id: newId("mail"), createdAt: new Date().toISOString() };
  setState({ outbox: [full, ...state.outbox].slice(0, 300) });
  return full;
}
export const outboxKindLabel: Record<OutboxKind, string> = { ebook: "E-book", "ebook-alert": "Admin alert", "quiz-plan": "Quiz plan" };

/* ------------------------------------------------------------------ */
/*  Admins & session (demo sign-in — real Google sign-in is a publish-phase addition)  */
/* ------------------------------------------------------------------ */

export function signIn(email: string, role: AdminRole) {
  const existing = state.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  const admins = existing
    ? state.admins.map((a) => (a.id === existing.id ? { ...a, lastLoginAt: new Date().toISOString() } : a))
    : [...state.admins, { id: newId("admin"), email, name: email.split("@")[0], role, active: true, lastLoginAt: new Date().toISOString() }];
  setState({ admins, session: { email, role: existing?.role ?? role } });
}
export function signOut() {
  setState({ session: null });
}
export function addAdmin(email: string, name: string, role: AdminRole) {
  setState({ admins: [...state.admins, { id: newId("admin"), email, name, role, active: true, lastLoginAt: null }] });
}
export function updateAdmin(id: string, patch: Partial<AdminUser>) {
  setState({ admins: state.admins.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
}
export function removeAdmin(id: string) {
  setState({ admins: state.admins.filter((a) => a.id !== id) });
}

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

/** A full backup restore: replaces every document at once (used by Settings → Data → Import). */
export function replaceState(next: StoreState) {
  undoStack = [];
  redoStack = [];
  state = next;
  persist();
  for (const l of listeners) l();
}

export function resetAll() {
  undoStack = [];
  redoStack = [];
  const fresh = freshState();
  setState(fresh);
}
export function clearSampleLeads() {
  setState({ enquiries: [], bookRequests: [], quizResults: [], outbox: [] });
}

/**
 * A book's requests/sent/downloads counters live on the record itself (so the shelf can show
 * them), but they are operational data, not editable content — they're bumped in both the
 * draft and the published copy directly, so neither Discard nor the next Publish can erase them.
 */
export function bumpEbookCounter(bookId: string, field: "requests" | "sent" | "downloads", by = 1) {
  const bump = (ws: Workspace): Workspace => ({
    ...ws,
    site: { ...ws.site, ebooks: ws.site.ebooks.map((b) => (b.id === bookId ? { ...b, [field]: (b[field] ?? 0) + by } : b)) },
  });
  setState({ draft: bump(state.draft), published: bump(state.published) });
}
