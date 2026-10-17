// Tables for the essays' view counter and comments. Idempotent: run it again after editing.
//   node --env-file=.env.local scripts/essay-talk-schema.mjs
//   TURSO_DATABASE_URL=http://127.0.0.1:4419 TURSO_AUTH_TOKEN=dev node scripts/essay-talk-schema.mjs
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");

const endpoint = url.replace(/^libsql:/, "https:").replace(/\/$/, "") + "/v2/pipeline";

async function run(statements) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      requests: [...statements.map((sql) => ({ type: "execute", stmt: { sql } })), { type: "close" }],
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)}`);
  return body.results ?? [];
}

const statements = [
  `CREATE TABLE IF NOT EXISTS essay_views (
     slug TEXT PRIMARY KEY,
     views INTEGER NOT NULL DEFAULT 0
   )`,
  // ip_hash is a truncated sha256 of the caller's address and the slug, never the address itself.
  // hidden is set by hand to take a comment down.
  `CREATE TABLE IF NOT EXISTS essay_comments (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     slug TEXT NOT NULL,
     name TEXT NOT NULL,
     body TEXT NOT NULL,
     created_at TEXT NOT NULL,
     ip_hash TEXT NOT NULL,
     hidden INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS essay_comments_slug ON essay_comments(slug, hidden, id)`,
];

const applied = await run(statements);
const failed = applied.filter((r) => r.type === "error");
for (const f of failed) console.error(f.error?.message);

console.log(failed.length ? `failed: ${failed.length}` : `essay tables are current (2 tables, 1 index)`);
process.exit(failed.length ? 1 : 0);
