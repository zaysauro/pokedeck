import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createNeonAuth } from "@neon/auth/next/server";

/**
 * Authentication via Neon Managed Better Auth (email one-time code).
 * The rest of the app only uses getViewer()/requireViewer(), so the provider can change later.
 */
export const authConfigured = Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);

export const auth = authConfigured
  ? createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
      logLevel: "silent",
    })
  : null;

/**
 * Local development only: DEV_FAKE_AUTH=1 lets you sign in as any test id (cookie "pd_dev_uid")
 * to exercise the social features against a local Postgres. Never active in production builds.
 */
export const devAuth = process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_AUTH === "1";

export interface Viewer {
  id: string;
  email: string | null;
}

export async function getViewer(): Promise<Viewer | null> {
  if (devAuth) {
    const id = (await cookies()).get("pd_dev_uid")?.value;
    return id ? { id, email: `${id}@dev.local` } : null;
  }
  if (!auth) return null;
  try {
    const { data } = await auth.getSession();
    const user = data?.user as { id: string; email?: string } | undefined;
    return user ? { id: user.id, email: user.email ?? null } : null;
  } catch {
    return null;
  }
}

export async function requireViewer(next: string): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return v;
}
