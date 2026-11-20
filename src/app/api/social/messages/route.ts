import { NextRequest } from "next/server";
import { getViewer } from "@/server/auth";
import { AppError } from "@/server/db";
import { listMessages } from "@/server/trading";

export const dynamic = "force-dynamic";

/** Polled by the chat (Neon has no push channel): returns messages newer than `after`. */
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
  const match = Number(req.nextUrl.searchParams.get("match"));
  const after = Number(req.nextUrl.searchParams.get("after") ?? 0);
  if (!Number.isInteger(match) || match <= 0) return Response.json({ error: "Conversa inválida." }, { status: 400 });
  try {
    const messages = await listMessages(viewer.id, match, Number.isInteger(after) && after > 0 ? after : undefined);
    return Response.json({ messages }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return Response.json({ error: e instanceof AppError ? e.message : "Erro" }, { status: 400 });
  }
}
