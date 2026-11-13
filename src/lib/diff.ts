import type { Path } from "./path";

export type Change = { path: Path; before: unknown; after: unknown };

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * A flat list of leaf-level differences between two values of the same shape. An array whose
 * length changed (a row added/removed/reordered-with-a-gap) is reported as one whole-array
 * change rather than confusing index noise; same-length arrays (including a plain reorder) are
 * compared index by index, so a reorder shows as "each shifted slot changed" — true, if verbose.
 */
export function diffDeep(a: unknown, b: unknown, path: Path = []): Change[] {
  if (a === b) return [];
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [{ path, before: a, after: b }];
    return a.flatMap((item, i) => diffDeep(item, b[i], [...path, i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((k) => diffDeep(a[k], b[k], [...path, k]));
  }
  return [{ path, before: a, after: b }];
}

function summarizeValue(v: unknown): string {
  if (v === undefined || v === null || v === "") return "(empty)";
  if (typeof v === "boolean") return v ? "on" : "off";
  if (typeof v === "string") return v.length > 60 ? `"${v.slice(0, 57)}…"` : `"${v}"`;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? "" : "s"}`;
  if (isPlainObject(v)) return "updated";
  return String(v);
}

const WORDS: Record<string, string> = { ebooks: "Books", seo: "SEO", cta: "Button", faqPreview: "FAQ on homepage" };
const titleCase = (s: string) =>
  WORDS[s] ??
  s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

/** A readable label for any path with no per-field map needed: `["site","hero","headline"]` → "Site › Hero › Headline". */
export function autoLabel(path: Path): string {
  return path.map((seg) => (typeof seg === "number" ? `#${seg + 1}` : titleCase(seg))).join(" › ");
}

/** One line per change: "Cover › Headline: \"old\" → \"new\"", using `labelFor` to name each path (defaults to `autoLabel`). */
export function humanizeDiff(changes: Change[], labelFor: (path: Path) => string | null = autoLabel): string[] {
  const lines: string[] = [];
  for (const c of changes) {
    const label = labelFor(c.path);
    if (!label) continue;
    lines.push(`${label}: ${summarizeValue(c.before)} → ${summarizeValue(c.after)}`);
  }
  return lines;
}
