export type RoomId = "today" | "inbox" | "website" | "cards" | "talk" | "quiz" | "books" | "pages" | "settings";

export type Room = { id: RoomId; n: string; title: string; short: string; path: string; icon: string };

/** The nine rooms, in rail order. `icon` is a one-glyph hint used by the 9-pad and mobile tabs. */
export const ROOMS: Room[] = [
  { id: "today", n: "01", title: "Today", short: "Today", path: "/admin", icon: "☀" },
  { id: "inbox", n: "02", title: "Inbox", short: "Inbox", path: "/admin/inbox", icon: "✉" },
  { id: "website", n: "03", title: "Website", short: "Site", path: "/admin/website", icon: "▤" },
  { id: "cards", n: "04", title: "The 9 cards", short: "Cards", path: "/admin/cards", icon: "⌖" },
  { id: "talk", n: "05", title: "Talk to us", short: "Talk", path: "/admin/talk", icon: "☎" },
  { id: "quiz", n: "06", title: "Quiz Lab", short: "Quiz", path: "/admin/quiz", icon: "?" },
  { id: "books", n: "07", title: "Books", short: "Books", path: "/admin/books", icon: "▣" },
  { id: "pages", n: "08", title: "Pages & FAQ", short: "Pages", path: "/admin/pages", icon: "▯" },
  { id: "settings", n: "09", title: "Settings", short: "Settings", path: "/admin/settings", icon: "⚙" },
];

export const roomByPath = (pathname: string): Room | undefined => ROOMS.find((r) => (r.path === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(r.path)));
