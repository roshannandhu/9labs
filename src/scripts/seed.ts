/** `pnpm seed` — fills an empty database from src/content/site.ts (the admin does this by itself on first start). */
import { getPayload } from "payload";
import config from "../payload.config";

const payload = await getPayload({ config });
const { totalDocs } = await payload.count({ collection: "services", overrideAccess: true });
payload.logger.info(totalDocs ? "The database already has content — nothing to do." : "Seeded.");
process.exit(0);
