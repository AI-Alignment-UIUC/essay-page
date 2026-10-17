import { one } from "@/lib/essay/db";
import { isEssaySlug, json, notFound } from "@/lib/essay/talk";

type Ctx = { params: Promise<{ slug: string }> };

const unavailable = (error: unknown) => {
  console.error("essay views", error);
  return json({ error: "Views are unavailable right now." }, 503);
};

export async function GET(_request: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!isEssaySlug(slug)) return notFound();
  try {
    const row = await one("SELECT views FROM essay_views WHERE slug = ?", [slug]);
    return json({ views: Number(row?.views ?? 0) });
  } catch (error) {
    return unavailable(error);
  }
}

export async function POST(_request: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!isEssaySlug(slug)) return notFound();
  try {
    const row = await one(
      "INSERT INTO essay_views (slug, views) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET views = views + 1 RETURNING views",
      [slug],
    );
    return json({ views: Number(row?.views ?? 0) });
  } catch (error) {
    return unavailable(error);
  }
}
