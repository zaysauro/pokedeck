import "server-only";
import { Pool, type PoolClient } from "pg";

/**
 * Postgres (Neon) access.
 *
 * Every request runs in a transaction that switches to the restricted `pokedeck_app` role and sets
 * `app.user_id`, so Row Level Security policies in the database enforce who can read/write what —
 * even if a bug slipped into the application code.
 */
const g = globalThis as unknown as { __pdPool?: Pool };

export const dbConfigured = () => Boolean(process.env.DATABASE_URL);

function pool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new AppError("SERVICE_UNAVAILABLE");
  g.__pdPool ??= new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 });
  return g.__pdPool;
}

export type Db = Pick<PoolClient, "query">;

export async function tx<T>(userId: string | null, fn: (db: Db) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("begin");
    await client.query("set local role pokedeck_app");
    await client.query("select set_config('app.user_id', $1, true)", [userId ?? ""]);
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (e) {
    await client.query("rollback").catch(() => undefined);
    throw toAppError(e);
  } finally {
    client.release();
  }
}

/* ------------------------------------------------------------------ errors */

const MESSAGES: Record<string, string> = {
  SERVICE_UNAVAILABLE: "A comunidade está temporariamente indisponível.",
  AUTH_REQUIRED: "Entre na sua conta para continuar.",
  PROFILE_REQUIRED: "Crie seu perfil de treinador para continuar.",
  NOT_ALLOWED: "Você não tem permissão para fazer isso.",
  NOT_FOUND: "Não encontrado.",
  RATE_LIMIT: "Calma! Você fez isso muitas vezes em pouco tempo. Tente de novo em instantes.",
  DECK_EMPTY: "Adicione pelo menos uma carta antes de publicar o deck.",
  DECK_TOO_LARGE: "Um deck pode ter no máximo 60 cartas.",
  DECK_NOT_PUBLISHED: "Este deck não está publicado.",
  INVALID_PARENT: "Resposta inválida.",
  USERNAME_TAKEN: "Este nome de usuário já está em uso.",
  INVALID_INPUT: "Verifique os dados informados.",
  MATCH_CLOSED: "Esta conversa foi encerrada ou o match não está mais ativo.",
};

export class AppError extends Error {
  constructor(public code: keyof typeof MESSAGES | string, message?: string) {
    super(message ?? MESSAGES[code] ?? "Algo deu errado. Tente novamente.");
  }
}

function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  const err = e as { code?: string; message?: string; constraint?: string };
  if (err?.code === "P0001" && err.message && MESSAGES[err.message]) return new AppError(err.message);
  if (err?.code === "23505") {
    if (err.constraint?.includes("username")) return new AppError("USERNAME_TAKEN");
    return new AppError("INVALID_INPUT", "Isso já foi registrado.");
  }
  if (err?.code === "42501" || err?.message?.includes("row-level security")) return new AppError("NOT_ALLOWED");
  if (err?.code === "23514" || err?.code === "22001" || err?.code === "23502") return new AppError("INVALID_INPUT");
  console.error("[db]", e);
  return new AppError("UNKNOWN", "Algo deu errado. Tente novamente.");
}

/** Result shape for server actions: never throws to the client. */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string; code?: string };

export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    const err = toAppError(e);
    return { ok: false, error: err.message, code: err.code };
  }
}
