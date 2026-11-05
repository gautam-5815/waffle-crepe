"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, isCoarsePointer } from "@/components/motion/motion";

/** Gold cursor follower that grows over links/buttons and shows their data-cursor-label. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || isCoarsePointer()) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.35 });
    const yTo = gsap.quickTo(el, "y", { duration: 0.35 });
    const move = (e: PointerEvent) => { xTo(e.clientX); yTo(e.clientY); };
    const over = (e: PointerEvent) => {
      const t = (e.target as Element).closest<HTMLElement>("a, button");
      if (!t) return;
      if (label.current) label.current.textContent = t.dataset.cursorLabel || "";
      gsap.to(el, { scale: t.dataset.cursorLabel ? 4 : 2.2, duration: 0.35 });
    };
    const out = (e: PointerEvent) => {
      const t = (e.target as Element).closest("a, button");
      if (!t || t.contains(e.relatedTarget as Node)) return;
      if (label.current) label.current.textContent = "";
      gsap.to(el, { scale: 1, duration: 0.35 });
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
    };
  }, []);
  return <div ref={ref} className="cursor" aria-hidden="true"><span ref={label} /></div>;
}

/** Thin gold scroll-progress bar along the top of the window. */
export function Progress() {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const t = gsap.to(bar.current, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, []);
  return <div className="progress" aria-hidden="true"><span ref={bar} /></div>;
}
