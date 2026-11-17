import { z } from "zod";
import { runBackup } from "@/lib/quiz/backup";
import { cleanQuizInput } from "@/lib/quiz/result";
import { runQuizAi } from "@/server/ai/run";
import { requireAdmin } from "@/server/auth";
import { getPublished, readWorkspace } from "@/server/content";
import { readForm } from "@/server/guard";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

const schema = z.object({
  answers: z.record(z.string().max(80), z.array(z.string().max(80)).max(12)),
  other: z.record(z.string().max(80), z.string().max(2000)).default({}),
});

/** The admin Test tab: the real chain on the DRAFT content (AI forced on), next to the backup. Writes no lead. */
export const POST = route(async (req: Request) => {
  await requireAdmin(req);
  const body = await readForm(req, schema);
  const data = (await readWorkspace("draft"))?.data ?? (await getPublished());
  const site = { ...data.site, quiz: { ...data.site.quiz, ai: { ...data.site.quiz.ai, enabled: true } } };
  const { answers, other } = cleanQuizInput(site, body.answers, body.other);
  const outcome = await runQuizAi(site, answers, other, "admin-test");
  return json({ ai: outcome, backup: runBackup(site, answers, other) });
});
