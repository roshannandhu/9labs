// Plain paragraphs <-> the rich-text format used by page bodies (the same shape the seed writes).

type Node = { type?: string; text?: string; children?: Node[] };

/** "One paragraph.\n\nAnother." → rich-text document */
export function paragraphsToRich(text: string) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return {
    root: {
      type: "root",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: paragraphs.map((p) => ({
        type: "paragraph",
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        textFormat: 0,
        textStyle: "",
        children: [{ type: "text", text: p, detail: 0, format: 0, mode: "normal" as const, style: "", version: 1 }],
      })),
    },
  };
}

/** rich-text document → plain paragraphs (headings and lists keep their text) */
export function richToParagraphs(doc: unknown): string {
  const root = (doc as { root?: Node } | null)?.root;
  if (!root?.children) return "";
  const text = (n: Node): string => (n.text !== undefined ? n.text : (n.children ?? []).map(text).join(""));
  return root.children
    .map((n) => text(n).trim())
    .filter(Boolean)
    .join("\n\n");
}
