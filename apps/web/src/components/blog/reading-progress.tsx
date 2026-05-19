"use client";

import { useEffect } from "react";

export function ReadingProgress() {
  useEffect(() => {
    function update() {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? `${(scrollTop / height) * 100}%` : "0%";
      document.documentElement.style.setProperty("--progress", progress);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return <div className="reading-progress" />;
}
