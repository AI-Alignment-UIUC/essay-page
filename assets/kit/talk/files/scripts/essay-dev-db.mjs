// A stand-in for the Turso store, for local runs only. It answers POST /v2/pipeline the way Turso
// does, over a SQLite file through node:sqlite (Node 22.5 or newer), so lib/essay/db.ts and the
// schema script run against it unchanged and a local test never writes to the live store.
//
//   node scripts/essay-dev-db.mjs --port 4419 --file .dev/essays.db
//
// Then TURSO_DATABASE_URL=http://127.0.0.1:4419 TURSO_AUTH_TOKEN=dev on whatever reads the store. It
// listens on 127.0.0.1 only and checks no token.
import { mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";

// node:sqlite prints an experimental warning when it loads. That one is dropped; any other warning
// still prints. It has to be in place before the import, which is why the import is dynamic.
process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (warning.name === "ExperimentalWarning" && /SQLite/i.test(warning.message)) return;
  console.warn(warning);
});
const { DatabaseSync } = await import("node:sqlite");

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const port = Number(flag("port", "4419"));
const file = flag("file", "");
if (!file || !Number.isInteger(port)) {
  console.error("usage: node scripts/essay-dev-db.mjs --port 4419 --file <path to a .db file, or :memory:>");
  process.exit(1);
}

if (file !== ":memory:") mkdirSync(dirname(resolve(file)), { recursive: true });
const db = new DatabaseSync(file);
db.exec("PRAGMA foreign_keys = ON");

// ---------------------------------------------------------------- values, both ways
// Turso sends integers as strings so nothing past 2^53 is rounded, floats as numbers, and blobs as
// base64. Rows are read with BigInt integers so the two numeric types stay apart on the way out.

function toParam(value) {
  if (!value || value.type === "null") return null;
  switch (value.type) {
    case "integer":
      return BigInt(value.value);
    case "float":
      return Number(value.value);
    case "text":
      return String(value.value ?? "");
    case "blob":
      return Buffer.from(value.base64 ?? "", "base64");
    default:
      throw new Error(`unknown value type: ${value.type}`);
  }
}

function toCell(value) {
  if (value === null || value === undefined) return { type: "null" };
  if (typeof value === "bigint") return { type: "integer", value: value.toString() };
  if (typeof value === "number") return { type: "float", value };
  if (typeof value === "string") return { type: "text", value };
  if (value instanceof Uint8Array) return { type: "blob", base64: Buffer.from(value).toString("base64") };
  return { type: "text", value: String(value) };
}

// ---------------------------------------------------------------- statements

const WRITES = /^\s*(insert|update|delete|replace)\b/i;

function execute(stmt) {
  const sql = String(stmt?.sql ?? "");
  const prepared = db.prepare(sql);
  prepared.setReadBigInts(true);
  const positional = Array.isArray(stmt.args) ? stmt.args.map(toParam) : [];
  const named = Array.isArray(stmt.named_args)
    ? Object.fromEntries(stmt.named_args.map(({ name, value }) => [name, toParam(value)]))
    : {};
  const bind = Object.keys(named).length ? [named, ...positional] : positional;
  const columns = prepared.columns();

  let rows = [];
  let changes = 0;
  let lastId = null;
  if (columns.length) {
    prepared.setReturnArrays(true);
    rows = prepared.all(...bind).map((cells) => cells.map(toCell));
    // An INSERT ... RETURNING has columns too. A plain SELECT reports no changes, as Turso does.
    if (WRITES.test(sql)) {
      const count = db.prepare("SELECT changes() AS c, last_insert_rowid() AS r").get();
      changes = Number(count.c);
      lastId = count.r;
    }
  } else {
    const out = prepared.run(...bind);
    changes = Number(out.changes);
    lastId = WRITES.test(sql) ? out.lastInsertRowid : null;
  }

  return {
    cols: columns.map((column) => ({ name: column.name, decltype: column.type ?? null })),
    rows: stmt.want_rows === false ? [] : rows,
    affected_row_count: changes,
    last_insert_rowid: lastId === null || lastId === undefined ? null : String(lastId),
    rows_read: 0,
    rows_written: 0,
    query_duration_ms: 0,
  };
}

// Each request in a pipeline gets its own result, and an error in one does not stop the ones after
// it. scripts/schema.mjs counts on that.
function pipeline(body) {
  const results = [];
  for (const request of body?.requests ?? []) {
    try {
      if (request?.type === "execute") {
        results.push({ type: "ok", response: { type: "execute", result: execute(request.stmt) } });
      } else if (request?.type === "close") {
        results.push({ type: "ok", response: { type: "close" } });
      } else {
        results.push({ type: "error", error: { message: `unsupported request: ${request?.type}` } });
      }
    } catch (error) {
      results.push({ type: "error", error: { message: error instanceof Error ? error.message : String(error) } });
    }
  }
  return { baton: null, base_url: null, results };
}

// ---------------------------------------------------------------- the server

const server = createServer((req, res) => {
  const send = (status, payload) => {
    const out = JSON.stringify(payload);
    res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(out) });
    res.end(out);
  };
  const path = (req.url ?? "").split("?")[0];
  if (req.method === "GET" && (path === "/health" || path === "/v2")) return send(200, { ok: true });
  if (req.method !== "POST" || path !== "/v2/pipeline") return send(404, { message: "not found" });

  const chunks = [];
  let size = 0;
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > 16 * 1024 * 1024) req.destroy();
    else chunks.push(chunk);
  });
  req.on("end", () => {
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return send(400, { message: "the body is not JSON" });
    }
    send(200, pipeline(body));
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`dev store on http://127.0.0.1:${port}, file ${file}`);
});

const stop = () => {
  server.close();
  db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
