import { getPayload } from "payload";
import config from "@payload-config";
import { afterIdentity, demoKey, demoLoginAllowed, redirectTo } from "@/lib/auth/flow";
import { sameOrigin } from "@/lib/auth/origin";
import { hmac, safeEqual } from "@/lib/auth/tokens";
import { overLimit } from "@/lib/forms/guard";

/**
 * Demo sign-in (DEMO_MODE=1 only): a shared key from the server settings opens the admin as the
 * first owner in ADMIN_EMAILS. Off everywhere else. Tries are limited per visitor.
 */
export async function POST(req: Request) {
  if (!demoLoginAllowed()) return new Response("Not found", { status: 404 });
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const payload = await getPayload({ config });
  if (await overLimit(payload, req, "demo-login", 10, 600)) return redirectTo(req, "/admin/login?error=locked");

  const form = await req.formData();
  const given = String(form.get("key") ?? "").trim();
  if (!given || !safeEqual(hmac(`demo:${given}`), hmac(`demo:${demoKey()}`))) return redirectTo(req, "/admin/login?error=demo-key");

  const owner = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)[0];
  if (!owner) return redirectTo(req, "/admin/login?error=denied");
  return afterIdentity(payload, req, owner, "Demo owner");
}
