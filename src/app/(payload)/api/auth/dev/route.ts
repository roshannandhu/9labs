import { getPayload } from "payload";
import config from "@payload-config";
import { afterIdentity, devLoginAllowed, redirectTo } from "@/lib/auth/flow";
import { sameOrigin } from "@/lib/auth/origin";

/**
 * Development only: stands in for Google while no Google keys are configured, so the admin can be
 * opened on a developer's machine. It goes through the same allow-list, e-mail code and trusted
 * device steps. It does not exist in production (devLoginAllowed is false there).
 */
export async function POST(req: Request) {
  if (!devLoginAllowed()) return new Response("Not found", { status: 404 });
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim();
  if (!email) return redirectTo(req, "/admin/login?error=denied");
  return afterIdentity(await getPayload({ config }), req, email);
}
