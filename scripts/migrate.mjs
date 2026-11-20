#!/usr/bin/env node
/**
 * Applies db/migrations/*.sql in order to DATABASE_URL (use the Neon *direct* / unpooled URL).
 * Each file runs in its own transaction and is recorded in app_meta.schema_migrations, so reruns are safe.
 *
 *   DATABASE_URL=postgres://... node scripts/migrate.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is required");
  process.exit(1);
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query("create schema if not exists app_meta");
await client.query(`create table if not exists app_meta.schema_migrations (
  name text primary key, checksum text not null, applied_at timestamptz not null default now())`);

const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
for (const name of files) {
  const sql = await readFile(path.join(dir, name), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex").slice(0, 16);
  const done = await client.query("select checksum from app_meta.schema_migrations where name = $1", [name]);
  if (done.rowCount && done.rows[0].checksum === checksum) {
    console.log(`skip   ${name}`);
    continue;
  }
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query(
      `insert into app_meta.schema_migrations (name, checksum) values ($1, $2)
       on conflict (name) do update set checksum = excluded.checksum, applied_at = now()`,
      [name, checksum],
    );
    await client.query("commit");
    console.log(`apply  ${name}${done.rowCount ? " (changed, re-applied)" : ""}`);
  } catch (e) {
    await client.query("rollback");
    console.error(`FAILED ${name}: ${e.message}`);
    process.exit(1);
  }
}
await client.end();
console.log("migrations up to date");
