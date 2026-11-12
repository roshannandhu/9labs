import type { Access, CollectionConfig } from "payload";
import { bool, select, text } from "../fields";
import { ownerField, ownerOnly } from "../access";
import { sessionStrategy } from "../../lib/auth/strategy";

type U = { id?: number | string; role?: string; active?: boolean } | null;
const ownerOrSelf: Access = ({ req }) => {
  const u = req.user as U;
  if (!u || u.active === false) return false;
  return u.role === "owner" ? true : { id: { equals: u.id } };
};

/**
 * Who may sign in to the admin. There are no passwords: sign-in is "Continue with Google", and
 * only for an e-mail that is listed here and switched on (src/lib/auth/*).
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Admin", plural: "Admins" },
  admin: {
    group: "Admin",
    useAsTitle: "email",
    defaultColumns: ["email", "name", "role", "active", "lastLoginAt"],
    description: "People who can sign in. Each signs in with the Google account of the e-mail listed here — there are no passwords. Switch “Can sign in” off to remove someone's access.",
  },
  auth: { disableLocalStrategy: true, strategies: [sessionStrategy], useSessions: false, tokenExpiration: 60 * 60 * 12 },
  access: {
    read: ownerOrSelf,
    update: ownerOrSelf,
    create: ownerOnly,
    delete: ({ req }) => ((req.user as U)?.role === "owner" && (req.user as U)?.active !== false ? { id: { not_equals: (req.user as U)?.id } } : false),
    admin: ({ req }) => Boolean(req.user && (req.user as U)?.active !== false),
  },
  fields: [
    {
      type: "row",
      fields: [
        text("email", "Google e-mail", "The Google account this person signs in with.", {
          required: true,
          unique: true,
          index: true,
          access: { update: ownerField },
          hooks: { beforeValidate: [({ value }: { value?: unknown }) => (typeof value === "string" ? value.trim().toLowerCase() : value)] },
          validate: (v: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? "")) || "Please enter a valid e-mail address.",
        }),
        text("name", "Name"),
      ],
    },
    {
      type: "row",
      fields: [
        select(
          "role",
          "Role",
          [
            { label: "Owner — everything, including admins", value: "owner" },
            { label: "Admin — content, book requests and enquiries", value: "admin" },
            { label: "Editor — website content only", value: "editor" },
          ],
          "editor",
          undefined,
          { required: true, access: { update: ownerField } },
        ),
        { ...bool("active", "Can sign in", true), access: { update: ownerField } } as never,
      ],
    },
    { name: "lastLoginAt", label: "Last sign-in", type: "date", admin: { readOnly: true, position: "sidebar", date: { pickerAppearance: "dayAndTime" } } },
    { name: "sessionVersion", type: "number", defaultValue: 1, admin: { hidden: true }, access: { update: () => false } },
  ],
};
