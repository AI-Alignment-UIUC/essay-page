// The essay page's Turso store. Turso over its HTTP pipeline API, so the site talks to SQLite with
// fetch and no driver package. TURSO_DATABASE_URL and TURSO_AUTH_TOKEN come from the host project;
// scripts/essay-talk-schema.mjs holds the tables the essays use.
import "server-only";

export type Value = string | number | null;
type Arg = { type: "text" | "integer" | "float" | "null"; value?: string };

// The production store holds real members, and every shell on the laptop can reach it. Outside a
// production build only a fake store on this machine is accepted, unless ESSAY_DB_LIVE=1 says the
// live one is meant.
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

const endpoint = () => {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const base = url.replace(/^libsql:/, "https:").replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production" && process.env.ESSAY_DB_LIVE !== "1") {
    let host = "";
    try {
      host = new URL(base).hostname;
    } catch {
      host = "";
    }
    if (!LOCAL_HOSTS.has(host)) {
      throw new Error(
        "Refusing a database that is not on this machine outside production. Run a fake store on 127.0.0.1 and point TURSO_DATABASE_URL at it, or set ESSAY_DB_LIVE=1 if the live store is meant.",
      );
    }
  }
  return base + "/v2/pipeline";
};

const arg = (v: Value): Arg => {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { type: "integer", value: String(v) } : { type: "float", value: String(v) };
  }
  return { type: "text", value: v };
};

const cast = (cell: { type: string; value?: string | number }): Value => {
  if (!cell || cell.type === "null") return null;
  if (cell.type === "integer") return Number(cell.value);
  if (cell.type === "float") return Number(cell.value);
  return cell.value === undefined ? null : String(cell.value);
};

export type Row = Record<string, Value>;

type Result = { rows: Row[]; changes: number };

// One round trip per call. Every statement in a call runs on the same connection, so a guarded
// UPDATE followed by its rows_affected read stays consistent.
export async function query(sql: string, args: Value[] = []): Promise<Result> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.TURSO_AUTH_TOKEN ?? ""}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt: { sql, args: args.map(arg) } }, { type: "close" }],
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`database HTTP ${res.status}`);
  const body = await res.json();
  const first = body?.results?.[0];
  if (!first || first.type === "error") {
    throw new Error(first?.error?.message ?? "database error");
  }
  const out = first.response?.result;
  const cols: string[] = (out?.cols ?? []).map((c: { name: string }) => c.name);
  const rows: Row[] = (out?.rows ?? []).map((cells: { type: string; value?: string }[]) => {
    const row: Row = {};
    cols.forEach((name, i) => {
      row[name] = cast(cells[i]);
    });
    return row;
  });
  return { rows, changes: Number(out?.affected_row_count ?? 0) };
}

export const rows = async (sql: string, args: Value[] = []): Promise<Row[]> => (await query(sql, args)).rows;

export const one = async (sql: string, args: Value[] = []): Promise<Row | null> => (await rows(sql, args))[0] ?? null;
