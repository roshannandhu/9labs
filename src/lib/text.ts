/**
 * Fills a `{token}` template for messages built from a mix of required and optional answers
 * (the Talk-to-us WhatsApp message, the quiz result). Three rules, applied line by line:
 *  - `[...{token}...]` — the bracketed run (and its brackets) disappears if every token inside
 *    it is empty; otherwise the brackets are dropped and its tokens are filled normally.
 *  - A line that only ever held tokens (nothing else) and ends up empty is dropped entirely —
 *    no stray blank line where "Budget: " would have been.
 *  - Runs of several blank lines left behind collapse to one, so paragraph spacing stays tidy.
 */
export function fillTemplate(template: string, values: Record<string, string | undefined>): string {
  const get = (k: string) => (values[k] ?? "").trim();
  const TOKEN = /\{(\w+)\}/g;
  const hasToken = (s: string) => new RegExp(TOKEN).test(s);

  const resolveBrackets = (line: string) =>
    line.replace(/\[([^[\]]*)]/g, (_, inner: string) => {
      const tokens = [...inner.matchAll(TOKEN)].map((m) => m[1]);
      return tokens.length && tokens.every((t) => !get(t)) ? "" : inner;
    });
  const fillTokens = (line: string) => line.replace(TOKEN, (_, k: string) => get(k));

  const lines = template.split("\n").map((raw) => {
    const hadToken = hasToken(raw);
    const filled = fillTokens(resolveBrackets(raw));
    return hadToken && filled.trim() === "" ? null : filled;
  });

  const kept: string[] = [];
  for (const l of lines) {
    if (l === null) continue;
    if (l.trim() === "" && kept[kept.length - 1]?.trim() === "") continue;
    kept.push(l);
  }
  while (kept[0]?.trim() === "") kept.shift();
  while (kept[kept.length - 1]?.trim() === "") kept.pop();
  return kept.join("\n");
}

/** Every `{token}` the template could reference (for the admin's clickable token list). */
export function templateTokens(template: string): string[] {
  return [...new Set([...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))];
}

/** A short, readable reference code for a lead ("NL-7K2Q") — easy to say over the phone or search for. */
export function shortRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I — avoids misreads
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `NL-${s}`;
}

/** An opaque id for matching a client-side record to itself (e.g. a quiz run) — never shown to anyone. */
export function opaqueRef(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
