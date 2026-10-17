"use client";

import { useEffect } from "react";
import { startEssayMotion } from "@/lib/essay/motion";

// The essay's motion, started once the page is in the browser. The work is in lib/essay/motion.ts.
export default function EssayMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lt-root");
    return root ? startEssayMotion(root) : undefined;
  }, []);
  return null;
}
