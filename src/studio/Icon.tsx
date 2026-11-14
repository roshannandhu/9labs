export type IconName = "dashboard" | "inbox" | "website" | "about" | "books" | "faq" | "quiz" | "settings";

/** The sidebar's own small icon set — one glyph per room, no icon library needed. */
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
    case "website":
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9h17" />
          <circle cx="6.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="8.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "about":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5" />
        </svg>
      );
    case "books":
      return (
        <svg {...common}>
          <path d="M12 6.5c-1.6-1.3-3.8-2-6.5-2a1 1 0 0 0-1 1v11.5a1 1 0 0 0 1 1c2.5 0 4.7.6 6.5 2 1.8-1.4 4-2 6.5-2a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1c-2.7 0-4.9.7-6.5 2z" />
          <path d="M12 6.5v13" />
        </svg>
      );
    case "faq":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.6 9.6c.3-1.1 1.3-1.9 2.5-1.9 1.4 0 2.6 1 2.6 2.3 0 1.9-2.4 1.9-2.6 3.6" />
          <circle cx="12" cy="16.3" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
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
  }
}
