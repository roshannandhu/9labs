import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import sharp from "sharp";

import { Users } from "./payload/collections/Users";
import { LoginEvents, RateHits } from "./payload/collections/System";
import { Media } from "./payload/collections/Media";
import { EbookFiles } from "./payload/collections/EbookFiles";
import { Services } from "./payload/collections/Services";
import { Values } from "./payload/collections/Values";
import { Ebooks } from "./payload/collections/Ebooks";
import { Leads } from "./payload/collections/Leads";
import { QuizSubmissions } from "./payload/collections/QuizSubmissions";
import { Enquiries } from "./payload/collections/Enquiries";
import { Faqs } from "./payload/collections/Faqs";
import { Pages } from "./payload/collections/Pages";
import { Company } from "./payload/globals/Company";
import { Navigation } from "./payload/globals/Navigation";
import { Homepage } from "./payload/globals/Homepage";
import { Footer } from "./payload/globals/Footer";
import { SiteSettings } from "./payload/globals/SiteSettings";
import { QuizSettings } from "./payload/globals/QuizSettings";
import { EnquirySettings } from "./payload/globals/EnquirySettings";
import { EbookSettings } from "./payload/globals/EbookSettings";
import { adminEndpoints } from "./payload/endpoints";
import { seedIfEmpty } from "./payload/seed";
import { createTransport, mailFromAddress } from "./lib/mail/transport";
import { appSecret } from "./lib/auth/tokens";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// The default database is a file next to the app; make sure its folder exists on a first start.
const databaseUrl = process.env.DATABASE_URI || `file:${path.resolve(process.cwd(), "data/ninelabs.db")}`;
if (databaseUrl.startsWith("file:")) fs.mkdirSync(path.dirname(databaseUrl.slice(5)), { recursive: true });

/**
 * The admin panel and the database behind the website.
 * Host-neutral: a SQLite file locally (same SQL dialect as Cloudflare D1), files on disk, and the
 * company mailbox over SMTP. Each of the three is one adapter, swapped here when the host is chosen.
 */
export default buildConfig({
  secret: appSecret(),
  serverURL: process.env.NEXT_PUBLIC_ADMIN_URL || "",
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    // no profile pictures fetched from an outside service
    avatar: "default",
    meta: { titleSuffix: " · Nine Labs Admin", icons: [{ rel: "icon", type: "image/svg+xml", url: "/admin-icon.svg" }] },
    components: {
      graphics: { Logo: "/payload/components/Brand#Logo", Icon: "/payload/components/Brand#Icon" },
      beforeLogin: ["/payload/components/LoginButtons#LoginButtons"],
      beforeDashboard: ["/payload/components/Dashboard#Dashboard"],
      logout: { Button: "/payload/components/LogoutButton#LogoutButton" },
    },
  },
  routes: { admin: "/admin", api: "/api" },
  collections: [Services, Enquiries, Ebooks, Leads, EbookFiles, QuizSubmissions, Values, Faqs, Pages, Media, Users, LoginEvents, RateHits],
  globals: [Company, Navigation, Homepage, Footer, SiteSettings, EnquirySettings, EbookSettings, QuizSettings],
  endpoints: adminEndpoints,
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: { url: databaseUrl },
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  email: nodemailerAdapter({
    defaultFromAddress: mailFromAddress(),
    defaultFromName: process.env.MAIL_FROM_NAME || "Nine Labs Solutions",
    transport: createTransport(),
    skipVerify: true,
  }),
  sharp,
  graphQL: { disable: true },
  telemetry: false,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  onInit: async (payload) => {
    await seedIfEmpty(payload);
  },
});
