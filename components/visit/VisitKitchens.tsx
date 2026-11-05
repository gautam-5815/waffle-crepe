"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/components/motion/motion";
import { useLenis, scrollToEl } from "@/components/motion/SmoothScroll";

// Silicon Oasis is the exact building; The Sustainable City is the community centre (approximate).
const PLACES = [
  {
    id: "dso", short: "Silicon Oasis", area: "Millennium Tower", lat: 25.1213, lon: 55.3728,
    eyebrow: "The original", name: ["Dubai Silicon", "Oasis"], address: ["Shop 02, Millennium Tower", "Uni Estate, Dubai Silicon Oasis", "Dubai, UAE"],
    directions: "https://www.google.com/maps/dir/?api=1&destination=25.1213,55.3728",
    embed: "https://maps.google.com/maps?q=25.1213,55.3728&z=16&output=embed",
  },
  {
    id: "tsc", short: "Sustainable City", area: "City Plaza", lat: 25.03, lon: 55.2805,
    eyebrow: "The newer one", name: ["The Sustainable", "City"], address: ["Block D1, Store R1", "Sustainable City Plaza, Wadi Al Safa 7", "The Sustainable City, Dubai"],
    directions: "https://www.google.com/maps/search/?api=1&query=Waffle+n+Crepe+The+Sustainable+City+Dubai",
    embed: "https://maps.google.com/maps?q=Waffle%20n%20Crepe%20The%20Sustainable%20City%20Dubai&z=16&output=embed",
  },
];

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLon = toR(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Click-to-load Google Map, so nothing third-party loads until asked. */
function MapLoad({ src, label }: { src: string; label: string }) {
  const [on, setOn] = useState(false);
  if (on) return <iframe src={src} title={label} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />;
  return (
    <button className="mapload" onClick={() => setOn(true)} aria-label={`Load Google Map for ${label}`}>
      <span className="mapload__grid" aria-hidden="true" />
      <span className="mapload__pin" aria-hidden="true" />
      <span className="mapload__cta">Tap to load the map</span>
      <small>Loads Google Maps</small>
    </button>
  );
}

export default function VisitKitchens() {
  const lenis = useLenis();
  const heroRef = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const map = useRef<{ focus: (i: number) => void; dispose: () => void } | null>(null);
  const [focused, setFocused] = useState(-1);
  const [finding, setFinding] = useState(false);
  const [found, setFound] = useState<{ near: number; dist: number[] } | null>(null);
  const [msg, setMsg] = useState("Uses your location once, on this device only.");

  const focus = (i: number) => { setFocused(i); map.current?.focus(i); };

  useEffect(() => {
    let cancelled = false;
    import("@/components/three/cityMap").then(({ createCityMap }) => {
      if (cancelled || !canvas.current || !labels.current) return;
      const places = PLACES.map((p, i) => ({
        ...p,
        onSelect: () => { setFocused(i); map.current?.focus(i); scrollToEl(lenis, document.getElementById(p.id)); },
      }));
      try { map.current = createCityMap(canvas.current, labels.current, places); }
      catch (err) { console.warn("WebGL unavailable", err); }
    });
    return () => { cancelled = true; map.current?.dispose(); map.current = null; };
  }, [lenis]);

  const kitchensRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) { gsap.set(".vhero__in", { autoAlpha: 1 }); return; }
      gsap.timeline({ delay: 0.1 })
        .from(".vhero__title .line > span", { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.12 })
        .fromTo(".vhero__in", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.9 }, 0.3);
      kitchensRef.current?.querySelectorAll<HTMLElement>(".kitchen__num").forEach((n) => {
        gsap.fromTo(n, { yPercent: 30 }, { yPercent: -30, ease: "none", scrollTrigger: { trigger: n.closest(".kitchen"), start: "top bottom", end: "bottom top", scrub: 1.2 } });
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const findNearest = () => {
    if (!("geolocation" in navigator)) { setMsg("Your browser can’t share location — both kitchens are listed below."); return; }
    setFinding(true);
    setMsg("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFinding(false);
        const me = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const dist = PLACES.map((p) => km(me, p));
        const near = dist[0] <= dist[1] ? 0 : 1;
        setFound({ near, dist });
        setMsg(`Closest: ${PLACES[near].short}, about ${Math.round(dist[near])} km away.`);
        focus(near);
      },
      (err) => {
        setFinding(false);
        setMsg(err.code === 1 ? "No problem — location stays off. Both kitchens are below." : "Couldn’t get your location right now. Both kitchens are below.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  };

  return (
    <>
      <section className="vhero" ref={heroRef}>
        <div className="vhero__copy">
          <p className="eyebrow vhero__in">Two kitchens in Dubai</p>
          <h1 className="vhero__title">
            <span className="line"><span>Come by.</span></span>
            <span className="line"><span><em>Or we’ll come to you.</em></span></span>
          </h1>
          <p className="vhero__sub vhero__in">Dubai Silicon Oasis and The Sustainable City — or order online and we deliver.</p>
          <div className="finder vhero__in">
            <button className="btn btn--gold" onClick={findNearest} disabled={finding} data-magnetic>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="currentColor" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              Find my nearest kitchen
            </button>
            <p className="finder__out" aria-live="polite">{msg}</p>
          </div>
        </div>
        <div className="vhero__map vhero__in">
          <canvas ref={canvas} aria-label="Illustrated 3D map of Dubai built from waffle cells, with pins on both kitchens" />
          <div className="maplabels" ref={labels} />
          <div className="vhero__mapctl">
            {[["Both", -1], ["Silicon Oasis", 0], ["Sustainable City", 1]].map(([label, i]) => (
              <button key={label} aria-pressed={focused === i} onClick={() => focus(i as number)}>{label}</button>
            ))}
          </div>
          <p className="vhero__note">Illustrated map — not to scale</p>
        </div>
      </section>

      <section className="kitchens" id="kitchens" ref={kitchensRef}>
        {PLACES.map((p, i) => (
          <article className={`kitchen${i === 1 ? " kitchen--flip" : ""}${found?.near === i ? " is-near" : ""}`} id={p.id} key={p.id}>
            <div className="kitchen__num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</div>
            <div className="kitchen__body">
              <p className="eyebrow" data-reveal>{p.eyebrow}</p>
              <h2 className="kitchen__name" data-motion-text>{p.name[0]} <em>{p.name[1]}</em></h2>
              <address data-reveal>{p.address.map((l) => <span key={l}>{l}<br /></span>)}</address>
              <div className="kitchen__actions" data-reveal>
                <a className="btn btn--dark" href={p.directions} target="_blank" rel="noopener" data-magnetic data-cursor-label="Go">Directions</a>
                <a className="btn btn--line" href="tel:+97143367664">Call 04 336 7664</a>
              </div>
              <p className={`kitchen__dist${found?.near === i ? " is-near" : ""}`} aria-live="polite">
                {found && `About ${found.dist[i] < 10 ? found.dist[i].toFixed(1) : Math.round(found.dist[i])} km from you${found.near === i ? " — your nearest" : ""}`}
              </p>
            </div>
            <figure className="kitchen__map" data-reveal>
              <MapLoad src={p.embed} label={p.name.join(" ")} />
            </figure>
          </article>
        ))}
      </section>
    </>
  );
}
