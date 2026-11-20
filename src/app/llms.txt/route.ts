import { getPublicContent } from "@/server/content";

export const dynamic = "force-dynamic";

/** A plain-text summary of the site for AI tools (llms.txt). Built from the live content, so it never goes stale. */
export async function GET() {
  const { site, pages } = await getPublicContent();
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.hero.sub}`,
    "",
    `Based in ${site.location}. Contact: ${site.contact.email}.`,
    "",
    "## Services",
    ...site.services.map((s) => `- ${s.title}: ${s.description}`),
    "",
    "## Pages",
    `- [Home](${site.url}/)`,
    ...pages.map((p) => `- [${p.title}](${site.url}/${p.slug}/)`),
    ...site.ebooks.filter((b) => b.enabled).map((b) => `- [${b.title} (free e-book)](${site.url}/ebooks/${b.slug}/)`),
  ];
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
