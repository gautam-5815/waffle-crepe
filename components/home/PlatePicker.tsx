"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/components/motion/motion";
import { useCart } from "@/components/chrome/Cart";

export type PlateOption = { name: string; price: number; img: string };

/** "Pick your plate": choosing a dish cross-fades its real photo and counts the live price up. */
export default function PlatePicker({ options }: { options: PlateOption[] }) {
  const shots = useRef<(HTMLElement | null)[]>([]);
  const priceEl = useRef<HTMLElement>(null);
  const badge = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const { add } = useCart();
  const sel = options[idx];

  const choose = (i: number) => {
    if (i === idx) return;
    const from = { v: options[idx].price };
    const prev = shots.current[idx];
    const next = shots.current[i];
    setIdx(i);

    if (prefersReducedMotion()) {
      gsap.set(prev, { autoAlpha: 0 });
      gsap.set(next, { autoAlpha: 1, scale: 1 });
    } else if (prev && next) {
      gsap.to(prev, { autoAlpha: 0, scale: 0.94, duration: 0.45, ease: "power2.inOut" });
      gsap.fromTo(next, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power3.out" });
    }

    gsap.to(from, {
      v: options[i].price,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => { if (priceEl.current) priceEl.current.textContent = String(Math.round(from.v)); },
    });
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
        <div className="plate__shots">
          {options.map((o, i) => (
            <figure
              key={o.name}
              className="plate__shot"
              style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
              ref={(el) => { shots.current[i] = el; }}
            >
              {o.img && <Image src={o.img} alt={i === idx ? o.name : ""} fill sizes="(max-width: 860px) 88vw, 42vw" priority={i === 0} />}
            </figure>
          ))}
        </div>
        <div className="plate__price" ref={badge} aria-live="polite">
          <span>{sel.name}</span>
          <strong>AED <b ref={priceEl}>{Math.round(sel.price)}</b></strong>
        </div>
      </div>
      <div className="plate__panel">
        <p className="eyebrow" data-reveal>Top recommendations</p>
        <h2 className="h2" data-motion-text>Pick your <em>plate.</em></h2>
        <p className="lead" data-reveal>Tap a favourite to see it. Prices are live from our shop.</p>
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
