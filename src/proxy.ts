import { NextResponse, type NextRequest } from "next/server";
import { hostRoute } from "@/lib/host-route";

export function proxy(req: NextRequest) {
  const r = hostRoute(req.nextUrl);
  if (!r) return NextResponse.next();
  return "redirect" in r ? NextResponse.redirect(r.redirect, 308) : NextResponse.rewrite(new URL(r.rewrite, req.url));
}

export const config = { matcher: "/((?!_next/static|_next/image).*)" };
