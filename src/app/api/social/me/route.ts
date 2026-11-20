import { authConfigured, devAuth, getViewer } from "@/server/auth";
import { dbConfigured } from "@/server/db";
import { badges, getMyProfile } from "@/server/trading";

export const dynamic = "force-dynamic";

/** Session snapshot for the header (keeps the rest of the site statically cacheable). */
export async function GET() {
  const enabled = dbConfigured() && (authConfigured || devAuth);
  const headers = { "Cache-Control": "private, no-store" };
  if (!enabled) return Response.json({ enabled: false, viewer: null }, { headers });
  const viewer = await getViewer();
  if (!viewer) return Response.json({ enabled: true, viewer: null }, { headers });
  try {
    const [profile, counts] = await Promise.all([getMyProfile(viewer.id), badges(viewer.id).catch(() => null)]);
    return Response.json({ enabled: true, viewer: { id: viewer.id, email: viewer.email }, profile, badges: counts, dev: devAuth }, { headers });
  } catch {
    return Response.json({ enabled: true, viewer: { id: viewer.id, email: viewer.email }, profile: null, badges: null, degraded: true }, { headers });
  }
}
