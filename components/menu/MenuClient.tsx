"use client";

import Image from "next/image";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { MenuGroup, MenuItem } from "@/lib/menu";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/components/motion/motion";
import { useLenis, scrollToEl } from "@/components/motion/SmoothScroll";
import PageMotion from "@/components/motion/PageMotion";
import { useCart } from "@/components/chrome/Cart";

export type NowItem = { preset: string; name: string; price: number };
const money = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

function Card({ item, wide }: { item: MenuItem; wide: boolean }) {
  const { add } = useCart();
  const offer = item.was > item.price;
  const initial = item.name.replace(/^[^A-Za-z]+/, "").charAt(0);
  return (
    <article className={`mcard${wide ? " mcard--wide" : ""}`} data-tilt data-card data-name={item.name.toLowerCase()}>
      <a className="mcard__media" href={item.url} target="_blank" rel="noopener" data-cursor-label="View" tabIndex={-1} aria-hidden="true">
        {item.img ? (
          <Image src={item.img} alt="" width={315} height={473} sizes="(max-width: 520px) 50vw, (max-width: 1100px) 33vw, 240px" />
        ) : (
          <span className="mcard__ph" aria-hidden="true">{initial}</span>
        )}
        {offer && <span className="mcard__tag">-{Math.round((1 - item.price / item.was) * 100)}%</span>}
      </a>
      <div className="mcard__body">
        <h3><a href={item.url} target="_blank" rel="noopener">{item.name}</a></h3>
        {item.note && <p className="mcard__note">{item.note}</p>}
        <div className="mcard__foot">
          <p className="mcard__price">
            <strong>AED {money(item.price)}</strong>
            {offer && <> <s>{money(item.was)}</s></>}
            {item.options && <> <span className="mcard__opt">options</span></>}
          </p>
          <button
            className="mcard__add"
            aria-label={`Add ${item.name} to order`}
            onClick={(e) => {
              const img = (e.currentTarget.closest("[data-card]") as HTMLElement).querySelector("img");
              add({ name: item.name, price: item.price, imgEl: img });
              gsap.fromTo(e.currentTarget, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
            }}
          >+</button>
        </div>
      </div>
    </article>
  );
}

export default function MenuClient({ groups, now, stats }: { groups: MenuGroup[]; now: NowItem[]; stats: { items: number; cats: number; from: number } }) {
  const lenis = useLenis();
  const { count, total, clear } = useCart();
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim().toLowerCase());
  const [active, setActive] = useState(groups[0]?.cats[0]?.slug ?? "");
  const [nowIdx, setNowIdx] = useState(0);
  const chipsRef = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<{ setPreset: (p: string) => void; dispose: () => void } | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => groups
    .map((g) => ({ ...g, cats: g.cats.map((c) => ({ ...c, items: q ? c.items.filter((i) => `${i.name} ${c.label}`.toLowerCase().includes(q)) : c.items })).filter((c) => c.items.length) }))
    .filter((g) => g.cats.length), [groups, q]);
  const shown = filtered.reduce((n, g) => n + g.cats.reduce((k, c) => k + c.items.length, 0), 0);

  // Hero 3D waffle cycles through real waffles.
  useEffect(() => {
    let cancelled = false;
    import("@/components/three/waffleScene").then(({ createWaffleScene }) => {
      if (cancelled || !canvas.current) return;
      try { scene.current = createWaffleScene(canvas.current, { preset: now[0]?.preset ?? "lotus", tilt: 0.7, distance: 11.5, particles: true }); }
      catch (err) { console.warn("WebGL unavailable", err); }
    });
    return () => { cancelled = true; scene.current?.dispose(); scene.current = null; };
  }, [now]);
  useEffect(() => {
    if (prefersReducedMotion() || now.length < 2) return;
    const id = setInterval(() => { if (!document.hidden) setNowIdx((i) => (i + 1) % now.length); }, 3600);
    return () => clearInterval(id);
  }, [now.length]);
  useEffect(() => { if (now[nowIdx]) scene.current?.setPreset(now[nowIdx].preset); }, [nowIdx, now]);

  // Hero intro.
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) { gsap.set(".mhero__in", { autoAlpha: 1 }); return; }
      gsap.timeline({ delay: 0.1 })
        .from(".mhero__title .line > span", { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.12 })
        .fromTo(".mhero__in", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.9 }, 0.3);
    }, heroRef);
    return () => ctx.revert();
  }, []);

  // Card reveals (batched) + active chip tracking; re-run when the filter changes the layout.
  useEffect(() => {
    let ctx: gsap.Context | undefined;
    const raf = requestAnimationFrame(() => {
    if (!listRef.current?.getClientRects().length) return;
    ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".mcard");
      if (!prefersReducedMotion() && !q) {
        gsap.set(cards, { autoAlpha: 0, y: 40 });
        ScrollTrigger.batch(cards, { start: "top 92%", once: true, onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power4.out", stagger: 0.06, overwrite: true }) });
      }
      gsap.utils.toArray<HTMLElement>(".mcat").forEach((sec) => {
        ScrollTrigger.create({ trigger: sec, start: "top 45%", end: "bottom 45%", onToggle: (s) => s.isActive && setActive(sec.id) });
      });
    }, listRef);
    ScrollTrigger.refresh();
    });
    return () => { cancelAnimationFrame(raf); ctx?.revert(); };
  }, [q]);

  // Keep the active chip in view.
  useEffect(() => {
    const chips = chipsRef.current;
    const chip = chips?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (chips && chip) chips.scrollTo({ left: chip.offsetLeft - chips.clientWidth / 2 + chip.clientWidth / 2, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [active]);

  const jumpToNow = () => {
    const name = now[nowIdx]?.name.toLowerCase();
    const target = document.querySelector<HTMLElement>(`.mcard[data-name="${CSS.escape(name ?? "")}"]`);
    if (!target) return;
    scrollToEl(lenis, target);
    gsap.set(target, { autoAlpha: 1, y: 0 });
    target.classList.remove("is-flash");
    void target.offsetWidth;
    target.classList.add("is-flash");
  };

  const n = now[nowIdx];
  return (
    <div className="page-menu">
      <section className="mhero" ref={heroRef}>
        <div className="mhero__grid" aria-hidden="true" />
        <div className="mhero__copy">
          <p className="eyebrow mhero__in">Full menu · live prices in AED</p>
          <h1 className="mhero__title">
            <span className="line"><span>The whole menu,</span></span>
            <span className="line"><span><em>hot off the iron.</em></span></span>
          </h1>
          <dl className="mhero__stats mhero__in">
            <div><dt>Items</dt><dd>{stats.items}</dd></div>
            <div><dt>Categories</dt><dd>{stats.cats}</dd></div>
            <div><dt>From</dt><dd>AED {money(stats.from)}</dd></div>
          </dl>
        </div>
        <div className="mhero__stage mhero__in">
          <canvas ref={canvas} aria-hidden="true" />
          {n && (
            <button className="mhero__now" onClick={jumpToNow}>
              <span>Now on the iron</span>
              <strong key={n.name} className="mhero__nowname">{n.name}</strong>
              <em>AED {money(n.price)} · see it ↓</em>
            </button>
          )}
        </div>
      </section>

      <div className="filter">
        <label className="filter__search">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="visually-hidden">Search the menu</span>
          <input type="search" placeholder="Search — try “lotus” or “pistachio”" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <nav className="filter__chips" aria-label="Menu categories" ref={chipsRef}>
          {filtered.flatMap((g) => g.cats).map((c) => (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              data-chip={c.slug}
              className={`chip${active === c.slug ? " is-active" : ""}`}
              aria-current={active === c.slug ? "true" : undefined}
              onClick={(e) => { e.preventDefault(); scrollToEl(lenis, document.getElementById(c.slug)); }}
            >
              {c.label}<sup>{c.items.length}</sup>
            </a>
          ))}
        </nav>
      </div>

      <div className="mlist" id="menuList" aria-live="polite" ref={listRef}>
        {filtered.map((g) => (
          <div className="mgroup" key={g.title}>
            <p className="mgroup__label" data-reveal>{g.title}</p>
            {g.cats.map((c) => (
              <section className="mcat" id={c.slug} aria-labelledby={`h-${c.slug}`} key={c.slug}>
                <header className="mcat__head">
                  <h2 id={`h-${c.slug}`} data-motion-text>{c.label}</h2>
                  <p><em className="mcat__count">{String(c.items.length).padStart(2, "0")}</em><span>{c.line}</span></p>
                </header>
                <div className="mcat__grid">
                  {c.items.map((i) => <Card key={i.name} item={i} wide={c.key === "Sharing Box"} />)}
                </div>
              </section>
            ))}
          </div>
        ))}
      </div>

      {shown === 0 && (
        <section className="mempty">
          <p className="h2">Nothing called “{query.trim()}” <em>yet.</em></p>
          <p className="lead">Try a flavour like lotus, kinder, pistachio or berry.</p>
          <button className="btn btn--dark" onClick={() => setQuery("")}>Clear search</button>
        </section>
      )}

      {count > 0 && (
        <aside className="tray" id="tray" aria-label="Your order">
          <div className="tray__sum">
            <strong>{count} {count === 1 ? "item" : "items"}</strong>
            <span>AED <b>{total.toFixed(2)}</b></span>
          </div>
          <button className="tray__clear" onClick={clear}>Clear</button>
          <a className="btn btn--gold" href="https://wafflencrepe.com/shop/" data-magnetic>Checkout on the shop →</a>
        </aside>
      )}

      <PageMotion deps={[q]} scope=".page-menu" />
    </div>
  );
}
