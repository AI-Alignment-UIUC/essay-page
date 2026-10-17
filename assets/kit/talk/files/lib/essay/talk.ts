// Shared by the view counter and comment routes under app/api/essays/[slug]. An essay is only
// reachable here if its slug is on this list.
import "server-only";
import { createHash } from "node:crypto";
import { ESSAY_SLUGS } from "@/lib/essay/slugs";

export const isEssaySlug = (slug: string) => ESSAY_SLUGS.includes(slug);

export const MAX_REQUEST_BYTES = 8 * 1024;
export const MAX_NAME = 60;
export const MAX_COMMENT = 2000;
export const MAX_LISTED = 500;
export const RATE_WINDOW_MS = 10 * 60 * 1000;
export const RATE_LIMIT = 3;

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const notFound = () => json({ error: "Not found" }, 404);

// ESSAY_ORIGINS is a comma-separated list of full origins, read on each request.
const configuredOrigins = () =>
  new Set((process.env.ESSAY_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean));

export const originAllowed = (origin: string | null) =>
  origin !== null && (configuredOrigins().has(origin) || /^http:\/\/localhost:\d+$/.test(origin));

// Control characters, C1 controls, and the invisible direction and joiner marks that can reorder or
// hide text. A line break survives in a comment body only.
const STRIP = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g;

export const cleanName = (raw: string) => raw.replace(STRIP, "").trim();

export const cleanBody = (raw: string) => raw.replace(/\r\n?/g, "\n").replace(STRIP, "").trim();

export const ipHash = (forwardedFor: string | null, slug: string) => {
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(`${ip}:${slug}`).digest("hex").slice(0, 32);
};

// Reads a request body as text and gives up once it passes the cap, so a large upload is never held
// in memory. Null means too large.
export async function readCapped(request: Request, cap = MAX_REQUEST_BYTES): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > cap) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > cap) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
