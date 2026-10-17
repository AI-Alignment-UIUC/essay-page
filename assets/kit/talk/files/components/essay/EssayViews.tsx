"use client";

import { useEffect, useState } from "react";

// The view count under the byline. A reader's first visit in this browser adds one (POST) and
// leaves a mark in localStorage; every visit after that only reads the count (GET). If the
// request fails the line stays empty, and its height is held either way so nothing moves.
const pending = new Map<string, Promise<number | null>>();

async function load(slug: string): Promise<number | null> {
  const key = `lt-viewed:${slug}`;
  const url = `/api/essays/${slug}/views`;
  let seen = false;
  try { seen = localStorage.getItem(key) !== null; } catch {}
  try {
    const res = await fetch(url, { method: seen ? "GET" : "POST", cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!seen) {
      try { localStorage.setItem(key, "1"); } catch {}
    }
    return typeof data?.views === "number" ? data.views : null;
  } catch {
    return null;
  }
}

export default function EssayViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    // One request per page load and slug: React's dev mode runs an effect twice, and both runs share this.
    let run = pending.get(slug);
    if (!run) {
      run = load(slug).finally(() => { pending.delete(slug); });
      pending.set(slug, run);
    }
    run.then((n) => { if (live) setViews(n); });
    return () => { live = false; };
  }, [slug]);
  return (
    <p className="lt-views" aria-live="polite">
      {views === null ? null : <span>{views.toLocaleString("en-US")} {views === 1 ? "view" : "views"}</span>}
    </p>
  );
}
