"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, isCoarsePointer } from "@/components/motion/motion";
import { useLenis } from "@/components/motion/SmoothScroll";

export type HeroShot = { src: string; alt: string };

/** Hero built on real product photography, with a first-visit loader and intro choreography. */
export default function HomeHero({ plate, pour }: { plate: HeroShot; pour: HeroShot }) {
  const root = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const [loader, setLoader] = useState<"show" | "hide" | "gone">("show");

  // Loader (first visit per session) → intro timeline → scroll parallax.
  useEffect(() => {
    const reduce = prefersReducedMotion();
    const seen = sessionStorage.getItem("wnc-loaded");
    let cancelled = false;
    const ctx = gsap.context(() => {
      const intro = () => {
        if (reduce) {
          gsap.set(".hero__in, .hero__plate, .hero__pour", { autoAlpha: 1 });
          return;
        }
        gsap
          .timeline({ delay: 0.1 })
          .fromTo(".hero__plate", { autoAlpha: 0, clipPath: "inset(0 0 100% 0)" }, { autoAlpha: 1, clipPath: "inset(0 0 0% 0)", duration: 1.5, ease: "expo.out" })
          .fromTo(".hero__plate img", { scale: 1.3 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0)
          .fromTo(".hero__title .line > span", { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 }, 0.25)
          .fromTo(".hero__in", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.9 }, 0.55)
          .fromTo(".hero__pour", { autoAlpha: 0, y: 48, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: "expo.out" }, 0.7)
          .fromTo(".hero__badge", { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 1, ease: "back.out(1.6)" }, 0.95);

        // The two photographs drift apart as the hero scrolls away.
        const scrub = { trigger: root.current, start: "top top", end: "bottom top", scrub: 1.1 };
        gsap.to(".hero__plate", { yPercent: -16, scale: 1.06, ease: "none", scrollTrigger: scrub });
        gsap.to(".hero__pour", { yPercent: -46, ease: "none", scrollTrigger: scrub });
        gsap.to(".hero__copy", { yPercent: 18, autoAlpha: 0.25, ease: "none", scrollTrigger: scrub });
      };
      if (seen || reduce) { setLoader("gone"); intro(); return; }
      lenis?.stop();
      const wait = Promise.race([document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 500))), new Promise((r) => setTimeout(r, 1600))]);
      wait.then(() => {
        if (cancelled) return;
        sessionStorage.setItem("wnc-loaded", "1");
        setLoader("hide");
        setTimeout(() => { setLoader("gone"); lenis?.start(); }, 900);
        intro();
      });
    }, root);
    return () => { cancelled = true; ctx.revert(); };
  }, [lenis]);

  // Photographs and badge drift gently with the pointer.
  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    const section = root.current!;
    const drift = [...section.querySelectorAll<HTMLElement>("[data-drift]")].map((el) => ({
      depth: Number(el.dataset.drift) || 1,
      x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
    }));
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      const dx = e.clientX - r.width / 2;
      const dy = e.clientY - r.top - r.height / 2;
      drift.forEach((d) => { d.x(dx * 0.012 * d.depth); d.y(dy * 0.012 * d.depth); });
    };
    section.addEventListener("pointermove", onMove);
    return () => section.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <section className="hero" ref={root}>
      {loader !== "gone" && (
        <div className={`loader${loader === "hide" ? " loader--out" : ""}`} aria-hidden="true">
          <div className="loader__grid">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
          <p>Warming the iron…</p>
        </div>
      )}
      <div className="hero__grid" aria-hidden="true" />

      <div className="hero__copy">
        <p className="eyebrow hero__in">Dubai Silicon Oasis · The Sustainable City</p>
        <h1 className="hero__title">
          <span className="line"><span>Golden grids,</span></span>
          <span className="line"><span><em>made to order.</em></span></span>
        </h1>
        <p className="hero__sub hero__in">Waffles, crepes and pancakes cooked the moment you order — with shakes, mojitos and coffee to match. Delivered across Dubai.</p>
        <div className="hero__ctas hero__in">
          <a className="btn btn--gold" href="https://wafflencrepe.com/shop/" data-magnetic data-cursor-label="Shop">Order online</a>
          <Link className="btn btn--line" href="/menu" data-magnetic>See the menu</Link>
        </div>
      </div>

      <div className="hero__art" aria-hidden={false}>
        <figure className="hero__plate" data-drift="1">
          <Image src={plate.src} alt={plate.alt} fill priority sizes="(max-width: 860px) 92vw, 46vw" />
        </figure>
        <figure className="hero__pour" data-drift="2.2">
          <Image src={pour.src} alt={pour.alt} fill sizes="(max-width: 860px) 40vw, 18vw" />
        </figure>
      </div>

      <div className="hero__badge hero__in" data-drift="1.6">
        <strong>Buy 2,<br />get 1 free</strong>
        <span>every weekday*</span>
      </div>
      <div className="hero__scroll hero__in" aria-hidden="true"><span />Scroll</div>
    </section>
  );
}
