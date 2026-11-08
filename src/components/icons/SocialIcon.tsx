type Name = "instagram" | "linkedin" | "x" | "facebook" | "tiktok" | "youtube" | "whatsapp" | "mail" | "phone" | "pin";

/** Simple line/solid glyphs for social and contact links (decorative; links carry aria-labels). */
export function SocialIcon({ name, size = 18 }: { name: Name; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true, focusable: false } as const;
  switch (name) {
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common} fill="currentColor">
          <path d="M5.2 8.6h3v10.2h-3zM6.7 4.2a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10.2 8.6h2.9V10h.04c.4-.76 1.38-1.56 2.85-1.56 3.05 0 3.6 2 3.6 4.6v5.76h-3v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.95 1.32-1.95 2.7v5.18h-3z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common} fill="currentColor">
          <path d="M17.6 3.5h2.9l-6.3 7.2 7.4 9.8h-5.8l-4.5-5.9-5.2 5.9H3.2l6.7-7.7-7.1-9.3h5.9l4.1 5.4zm-1 15.3h1.6L7.5 5.1H5.8z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M13.4 20.5v-7.3h2.5l.4-2.9h-2.9V8.5c0-.83.24-1.4 1.43-1.4h1.53V4.5a20 20 0 0 0-2.23-.12c-2.2 0-3.72 1.35-3.72 3.82v2.1H7.9v2.9h2.5v7.3z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.3 3.5c.3 2.2 1.6 3.6 3.8 3.8v2.6a6.5 6.5 0 0 1-3.8-1.2v5.9c0 3.4-2.5 5.9-5.8 5.9a5.8 5.8 0 0 1-5.8-5.8c0-3.5 3-6.1 6.6-5.7v2.8a3 3 0 0 0-3.8 2.9 3 3 0 0 0 3 3c1.8 0 3-1.3 3-3.3V3.5z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M21.2 7.7c-.2-1-.9-1.7-1.9-1.9C17.6 5.4 12 5.4 12 5.4s-5.6 0-7.3.4c-1 .2-1.7.9-1.9 1.9C2.4 9.4 2.4 12 2.4 12s0 2.6.4 4.3c.2 1 .9 1.7 1.9 1.9 1.7.4 7.3.4 7.3.4s5.6 0 7.3-.4c1-.2 1.7-.9 1.9-1.9.4-1.7.4-4.3.4-4.3s0-2.6-.4-4.3zM10 15.1V8.9l5.2 3.1z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2.6a9.3 9.3 0 0 0-8 14.1L2.7 21.4l4.8-1.3A9.3 9.3 0 1 0 12 2.6zm0 17a7.6 7.6 0 0 1-3.9-1.1l-.3-.2-2.8.8.8-2.8-.2-.3A7.7 7.7 0 1 1 12 19.6zm4.2-5.7c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.3 6.3 0 0 1-3.1-2.7c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.4z" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M4 7l8 6 8-6" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4h3.5l1.8 4.4-2.2 1.4a11 11 0 0 0 6.1 6.1l1.4-2.2L20 15.5V19a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.3" />
        </svg>
      );
  }
}
