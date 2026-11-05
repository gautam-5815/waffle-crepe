"use client";

import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "@/components/motion/motion";

/** Home-only scroll effects: pinned horizontal family-box gallery, offer parallax, breakfast drift. */
export default function HomeMotion() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let ctx: gsap.Context | undefined;
    // Defer a frame (see PageMotion) and scope selectors to the visible home page.
    const raf = requestAnimationFrame(() => {
    const page = [...document.querySelectorAll<HTMLElement>(".page-home")].find((el) => el.getClientRects().length > 0);
    if (!page) return;
    ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-parallax-layer]").forEach((layer) => {
        const speed = Number(layer.dataset.parallaxSpeed || 0.2);
        gsap.to(layer, {
          y: () => window.innerHeight * speed * -1, ease: "none",
          scrollTrigger: { trigger: layer.closest("[data-parallax-section]"), start: "top bottom", end: "bottom top", scrub: 1.2, invalidateOnRefresh: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".dish").forEach((d, i) => {
        gsap.to(d, { y: i % 2 ? -60 : -20, ease: "none", scrollTrigger: { trigger: ".breakfast__grid", start: "top bottom", end: "bottom top", scrub: 1.2 } });
      });
      const mm = gsap.matchMedia();
      mm.add("(min-width: 761px)", () => {
        const section = page.querySelector<HTMLElement>("[data-horizontal-gallery]");
        const track = section?.querySelector<HTMLElement>("[data-horizontal-track]");
        if (!section || !track) return;
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth), ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: () => `+=${track.scrollWidth - window.innerWidth}`, scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
        });
      });
    }, page);
    });
    return () => { cancelAnimationFrame(raf); ctx?.revert(); };
  }, []);
  return null;
}
