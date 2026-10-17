import { IBM_Plex_Mono, Newsreader } from "next/font/google";

// The essay's two faces. They are declared here and not in the site's own font file so that only
// the essay's route preloads them. essay-tokens.css points --lt-serif and --lt-mono at the variables.
export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});
