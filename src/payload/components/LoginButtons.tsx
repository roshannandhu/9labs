import { devLoginAllowed, googleConfigured } from "@/lib/auth/flow";

const ERRORS: Record<string, string> = {
  denied: "This Google account has no access to the admin. Ask an owner to add your e-mail under Admin → Admins.",
  google: "Google sign-in did not complete. Please try again.",
  "google-setup": "Google sign-in is not set up yet: add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server settings.",
};

type Props = { searchParams?: Record<string, string | string[] | undefined> };

/** The sign-in screen: one button. There are no passwords — Google proves who you are, and only listed admin e-mails get in. */
export function LoginButtons({ searchParams }: Props) {
  const error = typeof searchParams?.error === "string" ? ERRORS[searchParams.error] : undefined;
  return (
    <div className="nl-login">
      {error && (
        <p className="nl-auth__error" role="alert">
          {error}
        </p>
      )}
      {googleConfigured() ? (
        // eslint-disable-next-line @next/next/no-html-link-for-pages -- a server route that redirects to Google: it needs a full page load
        <a className="nl-login__google" href="/api/auth/google/start">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.500-4.800 7.200l7.700 6c4.500-4.200 7-10.300 7-17.700z" />
            <path fill="#FBBC05" d="M10.500 28.600A14.500 14.500 0 0 1 9.700 24c0-1.600.300-3.200.800-4.600l-7.900-6.200A24 24 0 0 0 0 24c0 3.900.900 7.500 2.600 10.800l7.900-6.200z" />
            <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.700-6c-2.200 1.500-5 2.300-8.200 2.300-6.300 0-11.600-4.100-13.500-9.900l-7.900 6.200C6.500 42.600 14.600 48 24 48z" />
          </svg>
          Continue with Google
        </a>
      ) : (
        !devLoginAllowed() && <p className="nl-auth__error">Google sign-in is not set up yet: add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server settings.</p>
      )}
      {devLoginAllowed() && (
        <form method="post" action="/api/auth/dev" className="nl-login__dev">
          <p>
            <strong>Development sign-in.</strong> No Google keys are configured on this machine, so type an admin e-mail instead. This box does not exist on the live site.
          </p>
          <input type="email" name="email" required placeholder="owner@example.com" autoComplete="email" />
          <button type="submit">Continue</button>
        </form>
      )}
      <p className="nl-login__note">Only listed admins can sign in. For safety, keep 2-Step Verification switched on in your Google account.</p>
    </div>
  );
}
