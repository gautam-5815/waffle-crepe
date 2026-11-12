"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/components/motion/motion";
import { useLenis } from "@/components/motion/SmoothScroll";
import { FRAME_COUNT, PACE } from "./walkPace";

/**
 * Scroll-driven walk into the café: scrolling is the only thing that moves the
 * camera, forwards or back, and the hero unpins once the walk is over.
 *
 * The frames live in public/frames and are played through PACE, which holds a
 * frame index per step of equal visual change — see walkPace.ts.
 *
 * Smoothness comes from decoding every frame before the walk starts. A webp
 * that has loaded but not decoded costs ~50ms the first time it is drawn,
 * which is three dropped frames right when the user scrolls onto it.
 */
const framePath = (i: number) => `/frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

/** Scroll length of the walk. Shorter on a phone, so it is not a thumb marathon. */
const scrollDistance = () => (window.matchMedia("(max-width: 860px)").matches ? "+=260%" : "+=420%");
/** Retina is worth it; beyond 2x is just fill-rate for no visible gain. */
const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
/**
 * How far the 16:9 frame may be cropped to fill a tall viewport. Cover alone
 * leaves a phone showing ~26% of the frame's width — a vertical slice with the
 * storefront cropped out of it. Past this limit the frame is letterboxed over
 * a blurred copy of itself instead.
 */
const MAX_CROP = 1.9;

export default function HeroWalkthrough() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const underRef = useRef<HTMLCanvasElement>(null);
  const lenis = useLenis();
  const [loader, setLoader] = useState<"show" | "hide" | "gone">("show");

  useEffect(() => {
    const reduce = prefersReducedMotion();
    const seen = sessionStorage.getItem("wnc-loaded");
    let cancelled = false;

    const images: (HTMLImageElement | undefined)[] = new Array(FRAME_COUNT);
    const ready: boolean[] = new Array(FRAME_COUNT).fill(false);
    let lastDrawn = -1;
    let wanted = 0;
    let raf = 0;
    let boxed = false;

    /** Nearest frame that has actually decoded, so the canvas never blanks. */
    const nearestReady = (i: number) => {
      if (ready[i]) return i;
      for (let step = 1; step < FRAME_COUNT; step++) {
        if (ready[i - step]) return i - step;
        if (ready[i + step]) return i + step;
      }
      return -1;
    };

    const draw = (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      const ctx2d = canvas?.getContext("2d");
      if (!canvas || !ctx2d) return;
      const { width: cw, height: ch } = canvas;
      const cover = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const fitWidth = cw / img.naturalWidth;
      const scale = Math.min(cover, fitWidth * MAX_CROP);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;

      const nowBoxed = h < ch - 1;
      if (nowBoxed !== boxed) {
        boxed = nowBoxed;
        root.current?.classList.toggle("walk--boxed", boxed);
      }
      if (boxed) {
        // Blurred fill behind the band. CSS does the blurring, so this canvas
        // is deliberately tiny — a few thousand pixels to scale up and smear.
        const under = underRef.current;
        const uctx = under?.getContext("2d");
        if (under && uctx) {
          const us = Math.max(under.width / img.naturalWidth, under.height / img.naturalHeight);
          const uw = img.naturalWidth * us;
          const uh = img.naturalHeight * us;
          uctx.drawImage(img, (under.width - uw) / 2, (under.height - uh) / 2, uw, uh);
        }
        ctx2d.clearRect(0, 0, cw, ch);
      }
      ctx2d.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    const paint = () => {
      raf = 0;
      const step = Math.min(Math.max(Math.round(wanted), 0), PACE.length - 1);
      const frame = PACE[step];
      if (frame === lastDrawn) return;
      const a = nearestReady(frame);
      if (a < 0) return;
      draw(images[a]!);
      lastDrawn = frame;
    };
    const schedulePaint = () => { if (!raf) raf = requestAnimationFrame(paint); };

    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr());
      canvas.height = Math.round(r.height * dpr());
      const ctx2d = canvas.getContext("2d");
      if (ctx2d) ctx2d.imageSmoothingQuality = "high"; // resets whenever width/height is set
      const under = underRef.current;
      if (under) { under.width = 64; under.height = Math.max(16, Math.round(64 * r.height / r.width)); }
      lastDrawn = -1; // force a repaint at the new size
      schedulePaint();
    };

    /** Load *and decode*: decode() is what keeps the scrub from hitching. */
    const loadFrame = async (i: number) => {
      if (images[i]) return;
      const img = new Image();
      images[i] = img;
      img.decoding = "async";
      img.src = framePath(i);
      try {
        await img.decode();
        ready[i] = true;
        if (!cancelled && PACE[Math.round(wanted)] === i) schedulePaint();
      } catch {
        // A frame that fails to decode stays unready; nearestReady covers it.
      }
    };

    const preloadAll = async () => {
      await loadFrame(0);
      if (cancelled) return;
      resize();
      for (let i = 1; i < FRAME_COUNT && !cancelled; i += 6) {
        const batch = [];
        for (let j = i; j < Math.min(i + 6, FRAME_COUNT); j++) batch.push(loadFrame(j));
        await Promise.all(batch);
      }
    };

    const render = (step: number) => {
      wanted = Math.min(Math.max(step, 0), PACE.length - 1);
      schedulePaint();
    };

    // Pinning re-wraps the section, which can change the canvas box without a
    // window resize — watch the element itself rather than the window.
    resize();
    preloadAll();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current) ro.observe(canvasRef.current);

    // ---- The scroll rig --------------------------------------------------
    const ctx = gsap.context(() => {
      const start = () => {
        if (reduce) { render(0); return; }
        const playhead = { step: 0 };
        gsap.to(playhead, {
          step: PACE.length - 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: scrollDistance,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: resize,
          },
          onUpdate: () => render(playhead.step),
        });
        ScrollTrigger.refresh();
      };
      if (seen || reduce) { setLoader("gone"); start(); return; }
      lenis?.stop();
      const wait = Promise.race([document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 400))), new Promise((r) => setTimeout(r, 1600))]);
      wait.then(() => {
        if (cancelled) return;
        sessionStorage.setItem("wnc-loaded", "1");
        setLoader("hide");
        setTimeout(() => { setLoader("gone"); lenis?.start(); }, 900);
        start();
      });
    }, root);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      ctx.revert();
    };
  }, [lenis]);

  return (
    <section className="walk" ref={root} aria-label="A walk into the Waffle n Crepe café">
      {loader !== "gone" && (
        <div className={`loader${loader === "hide" ? " loader--out" : ""}`} aria-hidden="true">
          <div className="loader__grid">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
          <p>Warming the iron…</p>
        </div>
      )}
      {/* Only shown when the frame is letterboxed — see MAX_CROP. */}
      <canvas className="walk__under" ref={underRef} aria-hidden="true" />
      <canvas className="walk__canvas" ref={canvasRef} aria-hidden="true" />
    </section>
  );
}
