"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";

const LenisContext = createContext<Lenis | null>(null);

// The Lenis instance lives outside React; components subscribe to it.
let current: Lenis | null = null;
const subs = new Set<() => void>();
const setCurrent = (l: Lenis | null) => { current = l; subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
export const useLenis = () => useContext(LenisContext);

/** Scroll to an element, under the sticky nav, smoothly when Lenis is running. */
export function scrollToEl(lenis: Lenis | null, el: Element | null, offset = -130) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset, duration: 1.2 });
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenis = useSyncExternalStore(subscribe, () => current, () => null);
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    document.documentElement.classList.add("has-motion");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (prefersReducedMotion()) return;
    const instance = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9, anchors: { offset: -90 } });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => instance.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setCurrent(instance);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setCurrent(null);
    };
  }, []);

  // On client-side navigation: jump to top (or the hash target) and re-measure triggers.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    if (target) setTimeout(() => scrollToEl(lenis, target), 350);
    else if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    const id = setTimeout(() => ScrollTrigger.refresh(), 200);
    return () => clearTimeout(id);
  }, [pathname, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
