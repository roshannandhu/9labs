import { requireAdmin } from "@/server/auth";
import { exportBackup } from "@/server/backup";
import { HttpError, json } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req, ["owner"]);
    const backup = await exportBackup();
    const name = `nine-labs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    return new Response(JSON.stringify(backup, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "Something went wrong." }, 500);
  }
}
