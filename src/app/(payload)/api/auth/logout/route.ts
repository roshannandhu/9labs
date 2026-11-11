import { redirectTo } from "@/lib/auth/flow";
import { SESSION_COOKIE } from "@/lib/auth/tokens";

/** Sign out: the session cookie is removed. */
function out(req: Request) {
  const res = redirectTo(req, "/admin/login");
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
export const GET = out;
export const POST = out;
