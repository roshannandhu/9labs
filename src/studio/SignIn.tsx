"use client";

import { LogoMark } from "@/components/brand/LogoMark";
import { signIn } from "@/lib/store";
import type { AdminRole } from "@/content/types";

const DEMO_ROLES: { role: AdminRole; email: string; blurb: string }[] = [
  { role: "owner", email: "owner@ninelabs.example", blurb: "Everything, including who else can sign in" },
  { role: "admin", email: "admin@ninelabs.example", blurb: "All website content, book requests, enquiries" },
  { role: "editor", email: "editor@ninelabs.example", blurb: "Website content only" },
];

/**
 * Google sign-in is the plan for the live site, but it needs a Google Cloud project and a real
 * server to complete — neither exists yet in this browser-only build. Until then, a clearly
 * labelled demo sign-in opens The Bridge with one of the three roles, exactly as the real thing
 * will once Settings → Team has a Google account connected.
 */
export function SignIn() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-st-bg px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center">
          <LogoMark className="h-10" />
          <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-st-sub">The Bridge · Admin</p>
        </div>

        <div className="st-card mt-7 p-6">
          <button type="button" disabled className="st-btn w-full !h-11 cursor-not-allowed opacity-50">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.8 7.2l7.7 6c4.5-4.2 7-10.3 7-17.7z" />
              <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.2.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.2z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Continue with Google
          </button>
          <p className="st-help mt-2 text-center">Not connected yet — add a Google account in Settings → Team once this is live.</p>

          <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-st-dim">
            <span className="h-px flex-1 bg-st-border" /> Demo sign-in <span className="h-px flex-1 bg-st-border" />
          </div>

          <div className="grid gap-2">
            {DEMO_ROLES.map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => signIn(r.email, r.role)}
                className="flex items-center justify-between gap-3 rounded-xl border border-st-border-strong px-4 py-3 text-left transition-colors hover:border-st-purple/60"
              >
                <span>
                  <span className="block text-[13.5px] font-semibold capitalize text-st-ink">{r.role}</span>
                  <span className="st-help">{r.blurb}</span>
                </span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <p className="st-help mt-4 text-center">Demo data lives only in this browser. Nothing is sent anywhere.</p>
      </div>
    </div>
  );
}
