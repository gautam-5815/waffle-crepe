"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, initReveals, initMagnetic, initTilt, initParallaxImages } from "./motion";

/**
 * Runs the shared reveal / magnetic / tilt system over the current page once it has rendered.
 *
 * Next 16 (Cache Components) keeps visited routes alive inside React <Activity>, so effects are
 * disconnected/reconnected rather than unmounted. Several components then create ScrollTriggers in
 * the same commit, which can corrupt ScrollTrigger's refresh loop. We defer creation by a frame and
 * refresh once, so triggers are always built against a settled, visible layout.
 */
export default function PageMotion({ deps = [] as unknown[], scope }: { deps?: unknown[]; scope: string }) {
  useEffect(() => {
    let ctx: gsap.Context | undefined;
    let offMag = () => {}, offTilt = () => {};
    const raf = requestAnimationFrame(() => {
      const root = [...document.querySelectorAll<HTMLElement>(scope)].find((el) => el.getClientRects().length > 0);
      if (!root) return;
      ctx = gsap.context(() => {
        initReveals(root);
        initParallaxImages(root);
        offMag = initMagnetic(root);
        offTilt = initTilt(root);
      });
      ScrollTrigger.refresh();
    });
    return () => {
      cancelAnimationFrame(raf);
      offMag();
      offTilt();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

/** Persistent footer wordmark rise — created once in the layout, refreshed on route changes. */
export function FooterMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tween: gsap.core.Tween | undefined;
    const raf = requestAnimationFrame(() => {
      tween = gsap.fromTo(".foot__big", { yPercent: 40, autoAlpha: 0.2 }, {
        yPercent: 0, autoAlpha: 1, ease: "none",
        scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 1 },
      });
    });
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      cancelAnimationFrame(raf);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      window.removeEventListener("load", onLoad);
    };
  }, []);
  return null;
}
