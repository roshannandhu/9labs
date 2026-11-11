import type { Access, FieldAccess } from "payload";

type U = { role?: string; active?: boolean } | null | undefined;
const role = (u: U) => (u && u.active !== false ? (u.role ?? "editor") : null);

/** Any signed-in admin user. */
export const signedIn: Access = ({ req }) => Boolean(role(req.user as U));
/** Owners and admins: requests, enquiries, exports. */
export const adminUp: Access = ({ req }) => ["owner", "admin"].includes(role(req.user as U) ?? "");
/** Owners only: who can sign in. */
export const ownerOnly: Access = ({ req }) => role(req.user as U) === "owner";
export const nobody: Access = () => false;
export const everyone: Access = () => true;

export const ownerField: FieldAccess = ({ req }) => role(req.user as U) === "owner";
export const noField: FieldAccess = () => false;

export const isAdminUp = (u: unknown) => ["owner", "admin"].includes(role(u as U) ?? "");
export const isSignedIn = (u: unknown) => Boolean(role(u as U));
