import type { AdminRole } from "@/content/types";
import type { Change } from "./diff";
import type { Path } from "./path";

/** An editor can change books and the quiz only — everything else (company, settings, pages…) is read-only to them. */
const EDITOR_ALLOWED: Path[] = [
  ["site", "ebooks"],
  ["site", "quiz"],
];

const startsWith = (path: Path, prefix: Path): boolean => prefix.every((p, i) => path[i] === p);

/** The first change this role isn't allowed to make, or null when every change is within their reach. */
export function firstForbiddenChange(role: AdminRole, changes: Change[]): Change | null {
  if (role !== "editor") return null;
  return changes.find((c) => !EDITOR_ALLOWED.some((prefix) => startsWith(c.path, prefix))) ?? null;
}
