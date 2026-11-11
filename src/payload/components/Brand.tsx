/** Nine Labs wordmark for the admin's sign-in screen and its small icon for the sidebar. */
export function Logo() {
  return (
    <div className="nl-brand">
      <span className="nl-brand__mark">L9BS</span>
      <span className="nl-brand__sub">Nine Labs Solutions · Admin</span>
    </div>
  );
}

export function Icon() {
  return (
    <span className="nl-brand__icon" aria-label="Nine Labs">
      9
    </span>
  );
}
