export type IconName =
  | "dashboard"
  | "inbox"
  | "books"
  | "quiz"
  | "settings"
  | "search"
  | "sun"
  | "moon"
  | "external"
  | "logout"
  | "chevron"
  | "plus"
  | "close"
  | "check"
  | "alert"
  | "info"
  | "copy"
  | "mail"
  | "whatsapp"
  | "phone"
  | "trash"
  | "upload"
  | "download"
  | "filter"
  | "menu"
  | "building"
  | "globe"
  | "palette"
  | "users"
  | "database"
  | "clock"
  | "eye"
  | "eye-off"
  | "grip"
  | "arrow-up-right"
  | "sparkle"
  | "map-pin";

/** The admin's whole icon set — one small, consistent stroke style, no icon library needed. */
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7.5" height="9" rx="2" />
          <rect x="13" y="3.5" width="7.5" height="5.5" rx="2" />
          <rect x="13" y="11.5" width="7.5" height="9" rx="2" />
          <rect x="3.5" y="15" width="7.5" height="5.5" rx="2" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...common}>
          <path d="M3.5 13.5h5l1.7 2.6h3.6l1.7-2.6h5" />
          <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5z" />
        </svg>
      );
    case "books":
      return (
        <svg {...common}>
          <path d="M12 6.5c-1.6-1.3-3.8-2-6.5-2a1 1 0 0 0-1 1v11.5a1 1 0 0 0 1 1c2.5 0 4.7.6 6.5 2 1.8-1.4 4-2 6.5-2a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1c-2.7 0-4.9.7-6.5 2z" />
          <path d="M12 6.5v13" />
        </svg>
      );
    case "quiz":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8 6.2 6.2" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M19 19l-4-4" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
        </svg>
      );
    case "external":
      return (
        <svg {...common}>
          <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M9 2h5v5M14 2 7 9" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="M5 8.5 12 15l7-6.5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M5 5l14 14M19 5 5 19" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M4.5 12.5l5 5 10-11" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <path d="M12 3.5 21.5 20h-19L12 3.5z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5.5" />
          <circle cx="12" cy="7.8" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <rect x="8.5" y="8.5" width="12" height="12" rx="2.3" />
          <path d="M15.5 8.5V5.8a2.3 2.3 0 0 0-2.3-2.3H5.8a2.3 2.3 0 0 0-2.3 2.3v7.4a2.3 2.3 0 0 0 2.3 2.3h2.7" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2.3" />
          <path d="M3.5 6.5 12 13l8.5-6.5" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M19.1 4.9A9.8 9.8 0 0 0 3.2 16.6L2.5 21.3l4.8-.7a9.8 9.8 0 0 0 11.8-15.7Z" />
          <path d="M8.3 8.6c.2-.5.5-.5.8-.5h.6c.2 0 .4 0 .6.5s.7 1.7.8 1.8c.1.2.1.4 0 .6-.1.2-.2.3-.4.5s-.4.4-.2.8c.2.4.9 1.5 2 2.4 1.3 1.1 2 1.3 2.4 1.1.3-.2.6-.6.8-.9.2-.3.4-.3.7-.2l1.7.8c.3.1.5.2.6.4.1.2.1.9-.2 1.6-.3.7-1.6 1.4-2.2 1.4-.6.1-1.3.1-4.3-1.3-3.4-1.6-5.4-5-5.6-5.3-.1-.2-1-1.4-1-2.6 0-1.3.6-1.9.9-2.1z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M5.5 4.5h3l1.3 4.2-2 1.5a12 12 0 0 0 5.9 5.9l1.5-2 4.2 1.3v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 4 5.6a1.5 1.5 0 0 1 1.5-1.1z" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" />
          <path d="M10.3 11v6M13.7 11v6" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 15.5V4M8 8l4-4 4 4" />
          <path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 4v11.5M8 11.5l4 4 4-4" />
          <path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" strokeOpacity="0.35" />
          <circle cx="8" cy="6" r="2" fill="var(--st-panel)" />
          <circle cx="15" cy="12" r="2" fill="var(--st-panel)" />
          <circle cx="10" cy="18" r="2" fill="var(--st-panel)" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
          <path d="M8.5 7.5h1.5M14 7.5h1.5M8.5 11h1.5M14 11h1.5M8.5 14.5h1.5M14 14.5h1.5" />
          <path d="M10.3 20.5V17h3.4v3.5" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.3 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.3-3.5-8.5S9.7 5.8 12 3.5z" />
        </svg>
      );
    case "palette":
      return (
        <svg {...common}>
          <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8h2.1c1.8 0 3.3-1.5 3.3-3.3 0-4.2-3.9-7.7-8-7.7z" />
          <circle cx="7.3" cy="10.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="9.8" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="17" cy="10.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8.5" r="3" />
          <path d="M3.5 19.5c0-3 2.5-5.3 5.5-5.3s5.5 2.3 5.5 5.3" />
          <path d="M15.8 5.8c1.4.3 2.4 1.5 2.4 2.9 0 1.4-1 2.6-2.4 2.9M18 14.5c2 .4 3.5 2.2 3.5 4.4" />
        </svg>
      );
    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="7.5" ry="2.8" />
          <path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6" />
          <path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5.3l3.5 2.1" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "eye-off":
      return (
        <svg {...common}>
          <path d="M3.5 3.5l17 17" />
          <path d="M10.6 5.7a9.9 9.9 0 0 1 1.4-.1c6 0 9.5 6.4 9.5 6.4a16.6 16.6 0 0 1-3.3 4.1M7.4 6.9A16.4 16.4 0 0 0 2.5 12s3.5 6.5 9.5 6.5c1.3 0 2.5-.3 3.6-.8" />
          <path d="M9.9 10a3 3 0 0 0 4.2 4.2" />
        </svg>
      );
    case "grip":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <circle cx="9" cy="6" r="1.3" />
          <circle cx="15" cy="6" r="1.3" />
          <circle cx="9" cy="12" r="1.3" />
          <circle cx="15" cy="12" r="1.3" />
          <circle cx="9" cy="18" r="1.3" />
          <circle cx="15" cy="18" r="1.3" />
        </svg>
      );
    case "arrow-up-right":
      return (
        <svg {...common}>
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2.5c.5 3.6 1.4 6 3 7.5 1.6 1.6 4 2.5 7.5 3-3.6.5-6 1.4-7.5 3-1.6 1.6-2.5 4-3 7.5-.5-3.6-1.4-6-3-7.5-1.6-1.6-4-2.5-7.5-3 3.6-.5 6-1.4 7.5-3 1.6-1.6 2.5-4 3-7.5z" />
        </svg>
      );
    case "map-pin":
      return (
        <svg {...common}>
          <path d="M12 21.5s7-6.4 7-12A7 7 0 0 0 5 9.5c0 5.6 7 12 7 12z" />
          <circle cx="12" cy="9.5" r="2.4" />
        </svg>
      );
  }
}
