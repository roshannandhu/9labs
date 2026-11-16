import { defaultWorkspace } from "@/content/defaults";
import { listAdmins, touchLastLogin } from "@/server/admins";
import { requireAdmin } from "@/server/auth";
import { readWorkspace } from "@/server/content";
import { json, route } from "@/server/http";
import { listBookRequests, listEnquiries, listOutbox, listQuizResults } from "@/server/leads";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  const session = await requireAdmin(req);

  const [draftRow, publishedRow] = await Promise.all([readWorkspace("draft"), readWorkspace("published")]);
  const isEditor = session.role === "editor";

  const [enquiries, bookRequests, quizResults, outbox, admins] = await Promise.all([
    isEditor ? [] : listEnquiries(),
    isEditor ? [] : listBookRequests(),
    isEditor ? [] : listQuizResults(),
    isEditor ? [] : listOutbox(),
    session.role === "owner" ? listAdmins() : [],
  ]);

  await touchLastLogin(session.id);

  return json({
    session: { email: session.email, name: session.name, role: session.role },
    draft: draftRow?.data ?? defaultWorkspace(),
    draftRev: draftRow?.rev ?? 0,
    published: publishedRow?.data ?? defaultWorkspace(),
    enquiries,
    bookRequests,
    quizResults,
    outbox,
    admins,
  });
});
