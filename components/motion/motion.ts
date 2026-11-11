// Shared motion system (from the cinematic-gsap-lenis skill), as plain functions so any client component can call them.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.85 });
}

export { gsap, ScrollTrigger };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isCoarsePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** Split a heading into masked words, keeping <em> accents intact. Safe to call twice. */
function splitWords(el: HTMLElement) {
  if (el.dataset.motionSplit) return;
  el.setAttribute("aria-label", (el.textContent ?? "").trim().replace(/\s+/g, " "));
  const nodes = [...el.childNodes];
  el.textContent = "";
  const addWord = (w: string, wrapTag: string | null) => {
    const mask = document.createElement("span");
    mask.className = "motion-word-mask";
    mask.setAttribute("aria-hidden", "true");
    const word = document.createElement("span");
    word.className = "motion-word";
    if (wrapTag) {
      const e = document.createElement(wrapTag);
      e.textContent = w;
      word.appendChild(e);
    } else word.textContent = w;
    mask.appendChild(word);
    el.appendChild(mask);
    el.appendChild(document.createTextNode(" "));
  };
  nodes.forEach((n) => {
    const tag = n.nodeType === 1 ? (n as Element).tagName.toLowerCase() : null;
    (n.textContent ?? "").split(/\s+/).filter(Boolean).forEach((w) => addWord(w, tag));
  });
  el.dataset.motionSplit = "true";
}

export function initReveals(root: ParentNode = document) {
  // Skip anything inside a hidden subtree (e.g. a previous route kept alive by React <Activity>).
  const q = (s: string) => [...root.querySelectorAll<HTMLElement>(s)].filter((el) => el.getClientRects().length > 0);
  if (prefersReducedMotion()) {
    gsap.set(q("[data-motion-text], [data-reveal], [data-reveal-item], [data-image-reveal]"), { autoAlpha: 1 });
    return;
  }
  q("[data-motion-text]").forEach((el) => {
    splitWords(el);
    gsap.set(el, { autoAlpha: 1 });
    gsap.fromTo(
      el.querySelectorAll(".motion-word"),
      { yPercent: 110, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.95, ease: "power4.out", stagger: 0.055, scrollTrigger: { trigger: el, start: "top 85%", once: true } }
    );
  });
  q("[data-reveal-group]").forEach((group) => {
    gsap.fromTo(
      group.querySelectorAll("[data-reveal-item]"),
      { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.95, ease: "power4.out", stagger: 0.06, scrollTrigger: { trigger: group, start: "top 88%", once: true } }
    );
  });
  q("[data-reveal]:not([data-reveal-item])").forEach((el) => {
    gsap.fromTo(el, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });
  q("[data-image-reveal]").forEach((fig) => {
    gsap.set(fig, { autoAlpha: 1 });
    gsap
      .timeline({ scrollTrigger: { trigger: fig, start: "top 85%", once: true } })
      .fromTo(fig, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "power4.out" })
      .fromTo(fig.querySelector("img"), { scale: 1.15 }, { scale: 1, duration: 1.4, ease: "power4.out" }, 0);
  });
}

/** Photographs drift slowly inside their frames as the page scrolls. */
export function initParallaxImages(root: ParentNode = document) {
  if (prefersReducedMotion()) return;
  root.querySelectorAll<HTMLElement>("[data-parallax-img]").forEach((img) => {
    const frame = img.parentElement;
    if (!frame || !img.getClientRects().length) return;
    gsap.fromTo(img, { yPercent: -8, scale: 1.18 }, {
      yPercent: 8, ease: "none",
      scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 1.2, invalidateOnRefresh: true },
    });
  });
}

type Cleanup = () => void;

export function initMagnetic(root: ParentNode = document): Cleanup {
  if (prefersReducedMotion() || isCoarsePointer()) return () => {};
  const offs: Cleanup[] = [];
  root.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.45 });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45 });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.25);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    offs.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
  });
  return () => offs.forEach((f) => f());
}

export function initTilt(root: ParentNode = document, strength = 8): Cleanup {
  if (prefersReducedMotion() || isCoarsePointer()) return () => {};
  const offs: Cleanup[] = [];
  root.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
    if (!el.getClientRects().length) return;
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6 });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6 });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * strength);
      rx(-((e.clientY - r.top) / r.height - 0.5) * strength);
    };
    const leave = () => { rx(0); ry(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    offs.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
  });
  return () => offs.forEach((f) => f());
}
