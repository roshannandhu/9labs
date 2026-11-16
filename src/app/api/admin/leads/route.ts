import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { listBookRequests, listEnquiries, listOutbox, listQuizResults } from "@/server/leads";

export const dynamic = "force-dynamic";

/** Polled every so often by the admin so leads that arrived elsewhere show up without a reload. */
export const GET = route(async (req: Request) => {
  await requireAdmin(req, ["owner", "admin"]);
  const [enquiries, bookRequests, quizResults, outbox] = await Promise.all([listEnquiries(), listBookRequests(), listQuizResults(), listOutbox()]);
  return json({ enquiries, bookRequests, quizResults, outbox });
});
