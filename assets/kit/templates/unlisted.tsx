import type { Metadata } from "next";
import Essay from "@/components/essay/Essay";
import type { EssayConfig, EssayDoc } from "@/lib/essay/types";
import doc from "@/content/essays/{{slug}}.json";
import config from "@/content/essays/{{slug}}.config.json";
// import EssayViews from "@/components/essay/EssayViews";
// import EssayComments from "@/components/essay/EssayComments";
import "../../../essay-tokens.css";
import "../../../essay.css";

// The unlisted copy of the draft. It is live on production at a path nothing links to, and it
// asks search engines to stay out. Delete this folder when the essay is published.
export const metadata: Metadata = {
  title: "{{title}}",
  description: "{{description}}",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main id="main">
      <Essay
        doc={doc as unknown as EssayDoc}
        config={config as unknown as EssayConfig}
        draft
        // afterByline={<EssayViews slug="{{slug}}" />}
        // afterCredits={<EssayComments slug="{{slug}}" />}
      />
    </main>
  );
}
