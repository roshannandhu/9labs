/**
 * A tiny, safe markdown-lite renderer for FAQ answers and page bodies written in the admin:
 * blank line = new paragraph, `**bold**`, `[text](https://…)` links, `- ` bullet lists, and
 * `#`/`##`/`###` headings on their own line. Everything else is escaped first, so admin text can
 * never inject raw HTML — only these five patterns ever produce a tag.
 */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(line: string): string {
  return esc(line)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function textToHtml(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) return "";

      if (lines.every((l) => l.startsWith("- "))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;

      const heading = lines.length === 1 && /^#{1,3}\s+\S/.test(lines[0]) ? lines[0].match(/^#{1,3}/)![0].length : 0;
      if (heading) {
        const tag = `h${Math.min(4, heading + 1)}`; // subordinate to the page's own <h1>
        return `<${tag}>${inline(lines[0].replace(/^#{1,3}\s+/, ""))}</${tag}>`;
      }

      return `<p>${lines.map(inline).join("<br>")}</p>`;
    })
    .join("");
}
