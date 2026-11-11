"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/components/motion/motion";
import { useLenis } from "@/components/motion/SmoothScroll";

/**
 * Scroll-driven walk into the café: scrolling is the only thing that moves the
 * camera, forwards or back, and the hero unpins once the walk is over.
 *
 * Two sources are supported. The live one is the frame sequence in
 * public/frames (frame_0001.webp …); set USE_FRAMES to false to fall back to
 * scrubbing the MP4, which is only as precise as its keyframes.
 *
 * Those frames are built from the 100-frame export in public/Frame by picking
 * source frames at equal *visual* spacing rather than equal numbering: the
 * export spends 70 frames on a slow push-in and the last 30 on two cuts, so a
 * linear scrub would crawl and then lurch. Resampling evens out the pace.
 */
const USE_FRAMES = true;
const FRAME_COUNT = 52;
const framePath = (i: number) => `/frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

const VIDEO_SRC = "/video/shop-tour.mp4";

/** Scroll length of the walk. Shorter on a phone, so it is not a thumb marathon. */
const scrollDistance = () => (window.matchMedia("(max-width: 860px)").matches ? "+=360%" : "+=500%");
/** Retina is worth it; beyond 2x is just fill-rate for no visible gain. */
const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

export default function HeroWalkthrough() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const backdropRef = useRef<HTMLVideoElement>(null);
  const lenis = useLenis();
  const [loader, setLoader] = useState<"show" | "hide" | "gone">("show");

  useEffect(() => {
    const reduce = prefersReducedMotion();
    const seen = sessionStorage.getItem("wnc-loaded");
    let cancelled = false;

    // ---- Frame sequence on a canvas -------------------------------------
    const images: (HTMLImageElement | undefined)[] = new Array(FRAME_COUNT);
    let lastDrawn = -1;
    let wanted = 0;
    let raf = 0;

    const drawCover = (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      const ctx2d = canvas?.getContext("2d");
      if (!canvas || !ctx2d) return;
      const { width: cw, height: ch } = canvas;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx2d.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    /** Nearest frame that has actually loaded, so the canvas never blanks. */
    const nearestLoaded = (i: number) => {
      if (images[i]?.complete) return i;
      for (let step = 1; step < FRAME_COUNT; step++) {
        if (images[i - step]?.complete) return i - step;
        if (images[i + step]?.complete) return i + step;
      }
      return -1;
    };

    /**
     * 84 frames is dense enough that the nearest one is always close, so the
     * playhead is simply rounded. No cross-fading: every pixel on screen comes
     * from one exported frame.
     */
    const paint = () => {
      raf = 0;
      const want = Math.round(wanted);
      if (want === lastDrawn) return;
      const ctx2d = canvasRef.current?.getContext("2d");
      if (!ctx2d) return;
      const a = nearestLoaded(want);
      if (a < 0) return;
      ctx2d.imageSmoothingQuality = "high";
      drawCover(images[a]!);
      lastDrawn = want;
    };
    const schedulePaint = () => { if (!raf) raf = requestAnimationFrame(paint); };

    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr());
      canvas.height = Math.round(r.height * dpr());
      lastDrawn = -1; // force a repaint at the new size
      schedulePaint();
    };

    const loadFrame = (i: number) =>
      new Promise<void>((resolve) => {
        if (images[i]) return resolve();
        const img = new Image();
        img.decoding = "async";
        img.onload = () => { if (i === wanted) schedulePaint(); resolve(); };
        img.onerror = () => resolve();
        img.src = framePath(i);
        images[i] = img;
      });

    const preloadAll = async () => {
      await loadFrame(0);
      if (cancelled) return;
      resize();
      // Fill in the rest a few at a time so the first paint is not starved.
      for (let i = 1; i < FRAME_COUNT && !cancelled; i += 4) {
        const batch = [];
        for (let j = i; j < Math.min(i + 4, FRAME_COUNT); j++) batch.push(loadFrame(j));
        await Promise.all(batch);
      }
    };

    // ---- Video scrubbing -------------------------------------------------
    let seeking = false;
    let pending = -1;
    const seekTo = (time: number) => {
      const v = videoRef.current;
      if (!v || !Number.isFinite(v.duration) || v.duration === 0) return;
      const t = Math.min(Math.max(time, 0), v.duration - 0.01);
      // The backdrop is blurred past recognition, so it can seek unqueued.
      const bg = backdropRef.current;
      if (bg?.duration) bg.currentTime = t;
      if (seeking) { pending = t; return; }        // never stack seek requests
      if (Math.abs(v.currentTime - t) < 0.01) return;
      seeking = true;
      v.currentTime = t;
    };
    const onSeeked = () => {
      seeking = false;
      if (pending >= 0) { const t = pending; pending = -1; seekTo(t); }
    };

    // `frame` arrives fractional from the scrub; paint() rounds to a real frame.
    const render = (frame: number) => {
      if (USE_FRAMES) { wanted = Math.min(Math.max(frame, 0), FRAME_COUNT - 1); schedulePaint(); }
      else {
        const v = videoRef.current;
        if (v?.duration) seekTo((frame / (FRAME_COUNT - 1)) * v.duration);
      }
    };

    const video = videoRef.current;
    video?.addEventListener("seeked", onSeeked);
    video?.pause();
    backdropRef.current?.pause();

    // Pinning re-wraps the section, which can change the canvas box without a
    // window resize — watch the element itself rather than the window.
    let ro: ResizeObserver | undefined;
    if (USE_FRAMES) {
      resize();
      preloadAll();
      ro = new ResizeObserver(resize);
      if (canvasRef.current) ro.observe(canvasRef.current);
    }

    // ---- The scroll rig --------------------------------------------------
    const ctx = gsap.context(() => {
      const start = () => {
        if (reduce) { render(0); return; }
        const playhead = { frame: 0 };
        gsap.to(playhead, {
          frame: FRAME_COUNT - 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: scrollDistance,
            scrub: 1.5,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: resize,
          },
          onUpdate: () => render(playhead.frame),
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
      ro?.disconnect();
      video?.removeEventListener("seeked", onSeeked);
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
      {USE_FRAMES ? (
        <canvas className="walk__canvas" ref={canvasRef} aria-hidden="true" />
      ) : (
        <>
          {/* The clip is portrait; a blurred copy fills the width so the whole
              frame can be shown on a wide screen instead of cropped to a slice. */}
          <video className="walk__backdrop" ref={backdropRef} src={VIDEO_SRC} muted playsInline preload="auto" aria-hidden="true" />
          <video className="walk__video" ref={videoRef} src={VIDEO_SRC} muted playsInline preload="auto" aria-hidden="true" />
        </>
      )}
    </section>
  );
}
