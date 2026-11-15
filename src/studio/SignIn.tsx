"use client";

import { useState } from "react";
import { LogoMark } from "@/components/brand/LogoMark";
import { supabase } from "./supabase";
import { Icon, type IconName } from "./Icon";

const FEATURES: { icon: IconName; text: string }[] = [
  { icon: "inbox", text: "Every lead in one inbox" },
  { icon: "dashboard", text: "A live dashboard" },
  { icon: "books", text: "Your books and quiz" },
];

function BrandPanel() {
  return (
    <div className="st-canvas relative hidden overflow-hidden bg-st-panel lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:p-12">
      <div className="st-drift pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgb(140_107_255/.25),transparent_70%)]" aria-hidden="true" />
      <div className="st-drift pointer-events-none absolute -bottom-32 -right-10 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgb(92_224_230/.18),transparent_70%)] [animation-delay:-8s]" aria-hidden="true" />
      <div className="relative">
        <LogoMark className="h-9" />
        <p className="mt-4 font-display text-[26px] font-semibold leading-tight text-st-ink">
          Nine Labs
          <br />
          Command Center
        </p>
      </div>
      <div className="relative grid gap-4">
        {FEATURES.map((f) => (
          <div key={f.text} className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-st-panel-3 text-st-purple">
              <Icon name={f.icon} size={16} />
            </span>
            <span className="text-[14px] text-st-sub">{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Read once on mount — this component only ever renders client-side, so there's no Suspense/SSR concern reading the URL directly. */
function urlError(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("error_description");
}

export function SignIn() {
  const [error] = useState(urlError);
  const [busy, setBusy] = useState(false);

  const continueWithGoogle = async () => {
    setBusy(true);
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}${base}/admin/` } });
  };

  return (
    <div className="st-canvas flex min-h-dvh lg:h-dvh">
      <BrandPanel />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 lg:py-0">
        <div className="flex flex-col items-center lg:hidden">
          <LogoMark className="h-9" />
          <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-st-sub">Nine Labs · Admin</p>
        </div>

        <div className="mt-7 w-full max-w-[400px] lg:mt-0">
          <h1 className="font-display text-[20px] font-semibold text-st-ink">Sign in</h1>

          <div className="st-panel mt-4 p-6">
            {error && <p className="mb-4 rounded-lg bg-st-danger-bg px-3 py-2 text-[12.5px] text-st-danger">{error}</p>}
            <button type="button" disabled={busy} onClick={() => void continueWithGoogle()} className="st-btn st-btn-primary w-full !h-11 justify-start gap-3 pl-4 disabled:opacity-60">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.8 7.2l7.7 6c4.5-4.2 7-10.3 7-17.7z" />
                <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.2.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.2z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
              </svg>
              {busy ? "Opening Google…" : "Continue with Google"}
            </button>
          </div>
          <p className="st-help mt-4 text-center">Only e-mails on the team (Settings → Team) can get in.</p>
        </div>
      </div>
    </div>
  );
}
