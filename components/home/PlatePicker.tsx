"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/components/motion/motion";
import { useCart } from "@/components/chrome/Cart";

export type PlateOption = { preset: string; name: string; price: number; img: string };

/** "Pick your plate": choosing a dish re-tops the 3D waffle and counts the real price up. */
export default function PlatePicker({ options }: { options: PlateOption[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<{ setPreset: (p: string) => void; dispose: () => void } | null>(null);
  const priceEl = useRef<HTMLElement>(null);
  const badge = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const { add } = useCart();
  const sel = options[idx];

  useEffect(() => {
    let cancelled = false;
    import("@/components/three/waffleScene").then(({ createWaffleScene }) => {
      if (cancelled || !canvas.current) return;
      try { scene.current = createWaffleScene(canvas.current, { preset: options[0].preset, tilt: 0.75, distance: 12.5 }); }
      catch (err) { console.warn("WebGL unavailable", err); }
    });
    return () => { cancelled = true; scene.current?.dispose(); scene.current = null; };
  }, [options]);

  const choose = (i: number) => {
    const from = { v: options[idx].price };
    setIdx(i);
    scene.current?.setPreset(options[i].preset);
    gsap.to(from, { v: options[i].price, duration: 0.6, ease: "power2.out", onUpdate: () => { if (priceEl.current) priceEl.current.textContent = String(Math.round(from.v)); } });
    gsap.fromTo(badge.current, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: "back.out(2)" });
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + options.length) % options.length;
    buttons.current[next]?.focus();
    choose(next);
  };

  return (
    <section className="plate" id="plate">
      <div className="plate__stage">
        <canvas ref={canvas} aria-label={`3D preview of ${sel.name}`} />
        <div className="plate__price" ref={badge} aria-live="polite">
          <span>{sel.name}</span>
          <strong>AED <b ref={priceEl}>{Math.round(sel.price)}</b></strong>
        </div>
      </div>
      <div className="plate__panel">
        <p className="eyebrow" data-reveal>Top recommendations</p>
        <h2 className="h2" data-motion-text>Pick your <em>plate.</em></h2>
        <p className="lead" data-reveal>Tap a favourite and watch it get topped. Prices are live from our shop.</p>
        <ul className="picker" role="listbox" aria-label="Choose a dish" data-reveal-group>
          {options.map((o, i) => (
            <li key={o.name} data-reveal-item>
              <button
                ref={(el) => { buttons.current[i] = el; }}
                role="option"
                aria-selected={i === idx}
                tabIndex={i === idx ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => onKey(e, i)}
              >
                {o.img ? <Image src={o.img} alt="" width={56} height={56} /> : <span />}
                <span>{o.name}</span>
                <em>{Math.round(o.price)}</em>
              </button>
            </li>
          ))}
        </ul>
        <button
          className="btn btn--dark plate__add"
          data-magnetic
          onClick={() => add({ name: sel.name, price: sel.price, imgEl: buttons.current[idx]?.querySelector("img") })}
        >
          Add {sel.name} to cart
        </button>
      </div>
    </section>
  );
}
