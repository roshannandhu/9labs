import type { IconName } from "./Icon";

export type RoomId = "dashboard" | "inbox" | "books" | "quiz" | "settings";

export type RoomGroup = "Overview" | "Content" | "System";

export type Room = { id: RoomId; title: string; path: string; icon: IconName; group: RoomGroup };

/** The five rooms, in sidebar order, grouped for the nav's mono section labels. */
export const ROOMS: Room[] = [
  { id: "dashboard", title: "Dashboard", path: "/", icon: "dashboard", group: "Overview" },
  { id: "inbox", title: "Inbox", path: "/inbox", icon: "inbox", group: "Overview" },
  { id: "books", title: "Books", path: "/books", icon: "books", group: "Content" },
  { id: "quiz", title: "Quiz", path: "/quiz", icon: "quiz", group: "Content" },
  { id: "settings", title: "Settings", path: "/settings", icon: "settings", group: "System" },
];

export const roomByPath = (pathname: string): Room | undefined => ROOMS.find((r) => (r.path === "/" ? pathname === "/" : pathname.startsWith(r.path)));
