"use client";

import type { Session as SupabaseSession } from "@supabase/supabase-js";
import { defaultWorkspace } from "@/content/defaults";
import type { AdminRole, AdminUser, BookRequest, Enquiry, OutboxKind, OutboxMail, QuizResult, Workspace } from "@/content/types";
import type { ArchiveFile, ArchiveListItem, ArchiveRun } from "@/lib/archive";
import { ApiError, api } from "./api";
import { supabase } from "./supabase";
import { diffDeep } from "@/lib/diff";
import { getIn, insertIntoArray, moveInArray, removeFromArray, setIn, type Path } from "@/lib/path";
import { normalizeWorkspace } from "@/lib/workspace";

export type Access = "loading" | "signed-out" | "denied" | "ok";
export type Sync = "saved" | "saving" | "offline" | "conflict";
export type Session = { email: string; name: string; role: AdminRole } | null;

export type StoreState = {
  access: Access;
  sync: Sync;
  session: Session;
  deniedEmail: string;
  draft: Workspace;
  draftRev: number;
  published: Workspace;
  enquiries: Enquiry[];
  bookRequests: BookRequest[];
  quizResults: QuizResult[];
  outbox: OutboxMail[];
  admins: AdminUser[];
};

function emptyState(): StoreState {
  const ws = defaultWorkspace();
  return { access: "loading", sync: "saved", session: null, deniedEmail: "", draft: ws, draftRev: 0, published: structuredClone(ws), enquiries: [], bookRequests: [], quizResults: [], outbox: [], admins: [] };
}

let state: StoreState = emptyState();
const listeners = new Set<() => void>();

function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getState(): StoreState {
  return state;
}

/** There is no server to render admin content at request time: every admin screen renders this
 * identically on the server and on the client's first paint, then `startAuth()` takes over. */
const EMPTY_SNAPSHOT: StoreState = emptyState();
export function getServerSnapshot(): StoreState {
  return EMPTY_SNAPSHOT;
}

/* ------------------------------------------------------------------ */
/*  Sign-in and hydration                                              */
/* ------------------------------------------------------------------ */

async function handleSession(session: SupabaseSession | null): Promise<void> {
  if (!session) {
    // UI preview without signing in: `next dev` only, and only when asked for with ?dev=1.
    // NODE_ENV is inlined at build time, so a production bundle drops this branch entirely —
    // and the server still rejects every call this fake session would make.
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("dev")) {
      const ws = defaultWorkspace();
      setState({
        access: "ok",
        sync: "saved",
        session: { email: "owner@ninelabs.example", name: "Dev Owner", role: "owner" },
        draft: ws,
        draftRev: 1,
        published: structuredClone(ws),
        enquiries: [],
        bookRequests: [],
        quizResults: [],
        outbox: [],
        admins: [{ id: "owner-1", email: "owner@ninelabs.example", name: "Dev Owner", role: "owner", active: true, lastLoginAt: null }],
      });
      return;
    }
    setState({ access: "signed-out", session: null });
    return;
  }
  await hydrate();
}

/** Call once on mount (Shell.tsx). `setTimeout(…, 0)` — supabase-js warns that awaiting inside the auth callback can deadlock. */
export function startAuth(): void {
  void supabase.auth.getSession().then(({ data }) => {
    setTimeout(() => void handleSession(data.session), 0);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => void handleSession(session), 0);
  });
}

type BootstrapResponse = { session: { email: string; name: string; role: AdminRole }; draft: Workspace; draftRev: number; published: Workspace; enquiries: Enquiry[]; bookRequests: BookRequest[]; quizResults: QuizResult[]; outbox: OutboxMail[]; admins: AdminUser[] };

export async function hydrate(): Promise<void> {
  try {
    const data = await api<BootstrapResponse>("/api/admin/bootstrap");
    setState({
      access: "ok",
      sync: "saved",
      session: data.session,
      draft: normalizeWorkspace(data.draft),
      draftRev: data.draftRev,
      published: normalizeWorkspace(data.published),
      enquiries: data.enquiries,
      bookRequests: data.bookRequests,
      quizResults: data.quizResults,
      outbox: data.outbox,
      admins: data.admins,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      const { data } = await supabase.auth.getSession();
      setState({ access: "denied", deniedEmail: data.session?.user.email ?? "" });
      return;
    }
    setState({ access: "signed-out" });
  }
}

export async function refreshLeads(): Promise<void> {
  if (state.access !== "ok" || state.session?.role === "editor") return;
  try {
    const data = await api<{ enquiries: Enquiry[]; bookRequests: BookRequest[]; quizResults: QuizResult[]; outbox: OutboxMail[] }>("/api/admin/leads");
    setState({ enquiries: data.enquiries, bookRequests: data.bookRequests, quizResults: data.quizResults, outbox: data.outbox });
  } catch {
    // a background refresh failing silently is fine — the next poll tries again
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  setState(emptyState());
  setState({ access: "signed-out" });
}

/* ------------------------------------------------------------------ */
/*  Draft editing — one generic mechanism for every field and list   */
/* ------------------------------------------------------------------ */

function setDraftState(next: Workspace) {
  setState({ draft: next });
  scheduleFlush();
}

export function setDraft(path: Path, value: unknown) {
  setDraftState(setIn(state.draft, path, value));
}
export function moveDraftItem(path: Path, from: number, to: number) {
  checkpoint();
  const arr = (getIn(state.draft, path) as unknown[]) ?? [];
  setDraftState(setIn(state.draft, path, moveInArray(arr, from, to)));
}
export function addDraftItem(path: Path, item: unknown, at?: number) {
  checkpoint();
  const arr = (getIn(state.draft, path) as unknown[]) ?? [];
  const next = at === undefined ? [...arr, item] : insertIntoArray(arr, at, item);
  setDraftState(setIn(state.draft, path, next));
}
export function removeDraftItem(path: Path, index: number) {
  checkpoint();
  const arr = (getIn(state.draft, path) as unknown[]) ?? [];
  setDraftState(setIn(state.draft, path, removeFromArray(arr, index)));
}

/* ------------------------------------------------------------------ */
/*  Undo / redo for the current editing session (not persisted)        */
/* ------------------------------------------------------------------ */

let undoStack: Workspace[] = [];
let redoStack: Workspace[] = [];

/** Call before a discrete edit (a list move/add/remove, or a field losing focus) to make it undoable. */
export function checkpoint() {
  undoStack.push(state.draft);
  if (undoStack.length > 60) undoStack.shift();
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
  setDraftState(prev);
}
export function redo() {
  const next = redoStack.pop();
  if (!next) return;
  undoStack.push(state.draft);
  setDraftState(next);
}

/* ------------------------------------------------------------------ */
/*  Saving to the server                                                */
/* ------------------------------------------------------------------ */

export function pendingChangeCount(): number {
  return diffDeep(state.published, state.draft).length;
}
export function hasUnpublishedChanges(): boolean {
  return pendingChangeCount() > 0;
}

let flushTimer: ReturnType<typeof setTimeout> | undefined;
let flushing = false;
let flushQueued = false;
let retryAttempt = 0;
const RETRY_DELAYS_MS = [5000, 15000, 30000];

function scheduleFlush() {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flushDraft(), 800);
}

/** Saves the current draft, with optimistic-concurrency retry/offline handling. One request at a time. */
export async function flushDraft(): Promise<void> {
  if (state.access !== "ok") return;
  if (flushing) {
    flushQueued = true;
    return;
  }
  flushing = true;
  clearTimeout(flushTimer);
  setState({ sync: "saving" });
  try {
    const { rev } = await api<{ rev: number }>("/api/admin/draft", { method: "PUT", json: { draft: state.draft, rev: state.draftRev } });
    retryAttempt = 0;
    setState({ draftRev: rev, sync: "saved" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      setState({ sync: "conflict" });
    } else {
      setState({ sync: "offline" });
      const delay = RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)];
      retryAttempt++;
      flushTimer = setTimeout(() => void flushDraft(), delay);
    }
  } finally {
    flushing = false;
    if (flushQueued) {
      flushQueued = false;
      void flushDraft();
    }
  }
}

/** Flushes first, so Publish never ships a draft the server hasn't seen yet. Throws ApiError(422) with `.details.issues` when blocked. */
export async function publish(summary: string[]): Promise<void> {
  await flushDraft();
  if (state.sync !== "saved") throw new Error("Can't publish right now — fix the sync issue first.");
  const { published } = await api<{ published: Workspace }>("/api/admin/publish", { json: { rev: state.draftRev, summary } });
  setState({ published: normalizeWorkspace(published) });
}

export function discardDraft(): void {
  undoStack = [];
  redoStack = [];
  setDraftState(structuredClone(state.published));
}

/* ------------------------------------------------------------------ */
/*  Leads                                                               */
/* ------------------------------------------------------------------ */

export async function removeLead(kind: "enquiry" | "book" | "quiz", id: string): Promise<void> {
  await api(`/api/admin/leads/${kind}/${id}`, { method: "DELETE" });
  if (kind === "enquiry") setState({ enquiries: state.enquiries.filter((e) => e.id !== id) });
  else if (kind === "book") setState({ bookRequests: state.bookRequests.filter((r) => r.id !== id) });
  else setState({ quizResults: state.quizResults.filter((r) => r.id !== id) });
}

export async function getOutboxHtml(id: string): Promise<string | null> {
  const { html } = await api<{ html: string | null }>(`/api/admin/outbox/${id}`);
  return html;
}

export const outboxKindLabel: Record<OutboxKind, string> = { ebook: "E-book", "ebook-alert": "Admin alert", "quiz-plan": "Quiz plan", test: "Test" };

/* ------------------------------------------------------------------ */
/*  Team                                                                */
/* ------------------------------------------------------------------ */

export async function addAdmin(email: string, name: string, role: AdminRole): Promise<void> {
  const { admin } = await api<{ admin: AdminUser }>("/api/admin/admins", { json: { email, name, role } });
  setState({ admins: [...state.admins, admin] });
}
export async function updateAdmin(id: string, patch: Partial<Pick<AdminUser, "role" | "active">>): Promise<void> {
  const { admin } = await api<{ admin: AdminUser }>(`/api/admin/admins/${id}`, { method: "PATCH", json: patch });
  setState({ admins: state.admins.map((a) => (a.id === id ? admin : a)) });
}
export async function removeAdmin(id: string): Promise<void> {
  await api(`/api/admin/admins/${id}`, { method: "DELETE" });
  setState({ admins: state.admins.filter((a) => a.id !== id) });
}

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

export async function downloadBackup(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/admin/backup/", { headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
  if (!res.ok) throw new Error("Could not download the backup.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "nine-labs-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

export const listArchives = () => api<{ archives: ArchiveListItem[] }>("/api/admin/archives").then((r) => r.archives);
export const readArchive = (name: string) => api<ArchiveFile>(`/api/admin/archives/${encodeURIComponent(name)}`);
export async function runArchiveNow(): Promise<ArchiveRun> {
  const run = await api<ArchiveRun>("/api/admin/archives", { method: "POST", json: {} });
  if ("archived" in run) await refreshLeads();
  return run;
}
export async function downloadArchive(name: string): Promise<void> {
  const file = await readArchive(name);
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function restoreBackup(file: File): Promise<void> {
  const text = await file.text();
  await api("/api/admin/restore", { method: "POST", body: text });
  await hydrate();
}

export async function resetAll(): Promise<void> {
  await api("/api/admin/reset", { method: "POST", json: {} });
  undoStack = [];
  redoStack = [];
  await hydrate();
}

export async function clearSampleLeads(): Promise<void> {
  await api("/api/admin/leads/clear-samples", { method: "POST", json: {} });
  await refreshLeads();
}

export async function loadSampleData(): Promise<void> {
  await api("/api/admin/sample", { method: "POST", json: {} });
  await refreshLeads();
}
