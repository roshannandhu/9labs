import type { AdminRole, Workspace } from "@/content/types";
import type { Change } from "./diff";
import type { Path } from "./path";

/** An editor can change books and the quiz only — everything else (company, settings, pages…) is read-only to them. */
const EDITOR_ALLOWED: Path[] = [
  ["site", "ebooks"],
  ["site", "quiz"],
];

const startsWith = (path: Path, prefix: Path): boolean => prefix.every((p, i) => path[i] === p);

/**
 * What an editor's save or publish may actually write: their books and quiz, everything else from `base`
 * (the current draft, or the live site when publishing). So an editor can never change settings, and never
 * publishes — or undoes — anyone else's unpublished work. Keep in step with EDITOR_ALLOWED.
 */
export function editorSlice(base: Workspace, theirs: Workspace): Workspace {
  const out = structuredClone(base);
  out.site.ebooks = structuredClone(theirs.site.ebooks);
  out.site.quiz = structuredClone(theirs.site.quiz);
  return out;
}

/** The first change this role isn't allowed to make, or null when every change is within their reach. */
export function firstForbiddenChange(role: AdminRole, changes: Change[]): Change | null {
  if (role !== "editor") return null;
  return changes.find((c) => !EDITOR_ALLOWED.some((prefix) => startsWith(c.path, prefix))) ?? null;
}
