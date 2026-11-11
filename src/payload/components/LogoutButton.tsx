/** Sign out (ends the session cookie; the device stays trusted). */
export function LogoutButton() {
  return (
    <a href="/api/auth/logout" className="nav__log-out nl-logout" aria-label="Sign out" title="Sign out">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" />
      </svg>
      <span>Sign out</span>
    </a>
  );
}
