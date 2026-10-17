import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Essay from "@/components/essay/Essay";
import type { EssayConfig, EssayDoc } from "@/lib/essay/types";
import doc from "@/content/essays/{{slug}}.json";
import config from "@/content/essays/{{slug}}.config.json";
// The view count and the comments are an optional module: init_essay.py --talk copies it in and
// turns on these two imports and the two props below.
// import EssayViews from "@/components/essay/EssayViews";
// import EssayComments from "@/components/essay/EssayComments";
import "../../essay-tokens.css";
import "../../essay.css";

// Flip to true when the essay is final. Until then the page is a 404 on the live site and wears a
// Draft tag in local dev and on Vercel preview deployments. The folder beside this file is the
// unlisted copy, which is live.
const PUBLISHED = false;
const DRAFT_OK = process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";

export const metadata: Metadata = {
  title: "{{title}}",
  description: "{{description}}",
};

// A published page is static. A draft reads the environment on each request, so one build answers
// 404 on production and the page on a preview. ?loud=0..1 is the dial for the motion and the change
// of mood (1 is all of it, 0 holds everything still on plain paper); motion.ts reads it in the browser.
export default async function Page() {
  if (!PUBLISHED) {
    await connection();
    if (!DRAFT_OK) notFound();
  }
  return (
    <main id="main">
      <Essay
        doc={doc as unknown as EssayDoc}
        config={config as unknown as EssayConfig}
        draft={!PUBLISHED}
        // afterByline={<EssayViews slug="{{slug}}" />}
        // afterCredits={<EssayComments slug="{{slug}}" />}
      />
    </main>
  );
}
