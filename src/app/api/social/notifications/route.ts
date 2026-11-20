import { getViewer } from "@/server/auth";
import { listNotifications } from "@/server/trading";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
  try {
    return Response.json({ notifications: await listNotifications(viewer.id) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ notifications: [] }, { status: 200 });
  }
}
