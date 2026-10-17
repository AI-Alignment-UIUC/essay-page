"use client";

import { useEffect, useState } from "react";

// Light or dark for the essay. The choice is written to data-theme on .lt-root (coloured in
// essay-tokens.css) and kept in localStorage under lt-theme. Light is the default.
export default function EssayTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lt-root");
    let kept: string | null = null;
    try { kept = localStorage.getItem("lt-theme"); } catch {}
    if (root && kept && root.dataset.theme !== kept) root.dataset.theme = kept;
    setDark(root?.dataset.theme === "dark");
  }, []);
  const flip = () => {
    const root = document.querySelector<HTMLElement>(".lt-root");
    if (!root) return;
    const next = dark ? "light" : "dark";
    root.classList.add("lt-snap"); // the paper changes at once; the slow fade is for moods
    root.dataset.theme = next;
    void root.offsetHeight;
    root.classList.remove("lt-snap");
    try { localStorage.setItem("lt-theme", next); } catch {}
    setDark(!dark);
  };
  return (
    <button type="button" className="lt-theme" onClick={flip} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      <span className="lt-theme-dot" aria-hidden="true" />
      {dark ? "Light" : "Dark"}
    </button>
  );
}
