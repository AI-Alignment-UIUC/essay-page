import { one, rows } from "@/lib/essay/db";
import {
  MAX_COMMENT,
  MAX_LISTED,
  MAX_NAME,
  RATE_LIMIT,
  RATE_WINDOW_MS,
  cleanBody,
  cleanName,
  ipHash,
  isEssaySlug,
  json,
  notFound,
  originAllowed,
  readCapped,
} from "@/lib/essay/talk";

type Ctx = { params: Promise<{ slug: string }> };

const unavailable = (error: unknown) => {
  console.error("essay comments", error);
  return json({ error: "Comments are unavailable right now." }, 503);
};

export async function GET(_request: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!isEssaySlug(slug)) return notFound();
  try {
    const found = await rows(
      "SELECT id, name, body, created_at FROM essay_comments WHERE slug = ? AND hidden = 0 ORDER BY id ASC LIMIT ?",
      [slug, MAX_LISTED],
    );
    return json({
      comments: found.map((r) => ({ id: Number(r.id), name: String(r.name), body: String(r.body), at: String(r.created_at) })),
    });
  } catch (error) {
    return unavailable(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!isEssaySlug(slug)) return notFound();
  if (!originAllowed(request.headers.get("origin"))) return json({ error: "This request is not allowed." }, 403);

  const text = await readCapped(request);
  if (text === null) return json({ error: "That comment is too large." }, 413);

  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return json({ error: "That did not look like a comment. Please try again." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return json({ error: "That did not look like a comment. Please try again." }, 400);
  }
  const { name, body, website } = input as Record<string, unknown>;

  // A hidden field no reader sees. A bot that fills it gets the same answer a reader would, and
  // nothing is stored.
  if (website != null && String(website).trim() !== "") {
    const shown = typeof name === "string" ? cleanName(name).slice(0, MAX_NAME) : "";
    const said = typeof body === "string" ? cleanBody(body).slice(0, MAX_COMMENT) : "";
    return json(
      { comment: { id: Math.floor(Math.random() * 1_000_000) + 1_000_000, name: shown || "Anonymous", body: said || "Thanks.", at: new Date().toISOString() } },
      201,
    );
  }

  const who = typeof name === "string" ? cleanName(name) : "";
  const said = typeof body === "string" ? cleanBody(body) : "";
  if (!who) return json({ error: "Please add your name." }, 400);
  if (who.length > MAX_NAME) return json({ error: `Your name can be at most ${MAX_NAME} characters.` }, 400);
  if (!said) return json({ error: "Please write a comment." }, 400);
  if (said.length > MAX_COMMENT) return json({ error: `Your comment can be at most ${MAX_COMMENT} characters.` }, 400);

  const at = new Date().toISOString();
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const hash = ipHash(request.headers.get("x-forwarded-for"), slug);

  try {
    // One statement, so the count and the insert cannot be split by a second request. No row comes
    // back when the caller already has RATE_LIMIT comments in the window.
    const row = await one(
      `INSERT INTO essay_comments (slug, name, body, created_at, ip_hash, hidden)
       SELECT ?, ?, ?, ?, ?, 0
       WHERE (SELECT COUNT(*) FROM essay_comments WHERE ip_hash = ? AND created_at > ?) < ?
       RETURNING id`,
      [slug, who, said, at, hash, hash, since, RATE_LIMIT],
    );
    if (!row) return json({ error: "You've posted a few comments in a row. Try again in a few minutes." }, 429);
    return json({ comment: { id: Number(row.id), name: who, body: said, at } }, 201);
  } catch (error) {
    return unavailable(error);
  }
}
