"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion, isCoarsePointer } from "@/components/motion/motion";
import { useLenis } from "@/components/motion/SmoothScroll";

/** Hero with the live 3D waffle, first-visit loader and intro choreography. */
export default function HomeHero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lenis = useLenis();
  const [loader, setLoader] = useState<"show" | "hide" | "gone">("show");

  // 3D scene (client-only; three.js is loaded lazily so it never blocks first paint).
  useEffect(() => {
    let scene: { setPointer: (x: number, y: number) => void; setScroll: (p: number) => void; dispose: () => void } | undefined;
    let cancelled = false;
    let st: ScrollTrigger | undefined;
    const move = (e: PointerEvent) => scene?.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    import("@/components/three/waffleScene").then(({ createWaffleScene }) => {
      if (cancelled || !canvas.current) return;
      try {
        scene = createWaffleScene(canvas.current, { particles: true, preset: "berry", tilt: 0.62, distance: 12.5 });
      } catch (err) { console.warn("WebGL unavailable", err); return; }
      if (!isCoarsePointer()) window.addEventListener("pointermove", move);
      if (!prefersReducedMotion()) {
        st = ScrollTrigger.create({ trigger: root.current, start: "top top", end: "bottom top", scrub: 1, onUpdate: (s) => scene?.setScroll(s.progress) });
      }
    });
    return () => { cancelled = true; st?.kill(); window.removeEventListener("pointermove", move); scene?.dispose(); };
  }, []);

  // Loader (first visit per session) → intro timeline.
  useEffect(() => {
    const reduce = prefersReducedMotion();
    const seen = sessionStorage.getItem("wnc-loaded");
    const ctx = gsap.context(() => {
      const intro = () => {
        if (reduce) { gsap.set(".hero__in", { autoAlpha: 1 }); return; }
        gsap.timeline({ delay: 0.1 })
          .from(".hero__canvas", { autoAlpha: 0, scale: 0.7, rotate: -20, duration: 1.6, ease: "expo.out" })
          .from(".hero__title .line > span", { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.12 }, 0.25)
          .fromTo(".hero__in", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.9 }, 0.6)
          .from(".hero__badge", { scale: 0, rotate: -90, duration: 1, ease: "back.out(1.6)" }, 0.9);
        gsap.to(".hero__canvas", { yPercent: -30, scale: 0.85, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 1.2 } });
      };
      if (seen || reduce) { setLoader("gone"); intro(); return; }
      lenis?.stop();
      const wait = Promise.race([document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 500))), new Promise((r) => setTimeout(r, 1600))]);
      wait.then(() => {
        sessionStorage.setItem("wnc-loaded", "1");
        setLoader("hide");
        setTimeout(() => { setLoader("gone"); lenis?.start(); }, 900);
        intro();
      });
    }, root);
    return () => ctx.revert();
  }, [lenis]);

  // Badge drifts slightly with the pointer.
  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    const section = root.current!;
    const badge = section.querySelector<HTMLElement>(".hero__badge")!;
    const x = gsap.quickTo(badge, "x", { duration: 0.8 }), y = gsap.quickTo(badge, "y", { duration: 0.8 });
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      x((e.clientX - r.width / 2) * 0.03);
      y((e.clientY - r.top - r.height / 2) * 0.03);
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
      <canvas ref={canvas} className="hero__canvas" aria-label="A 3D waffle topped with strawberries, blueberries and syrup, slowly turning" />
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
      <div className="hero__badge hero__in">
        <strong>Buy 2,<br />get 1 free</strong>
        <span>every weekday*</span>
      </div>
      <div className="hero__scroll hero__in" aria-hidden="true"><span />Scroll</div>
      <p className="hero__hint hero__in" aria-hidden="true">Move your cursor — the waffle follows</p>
    </section>
  );
}
