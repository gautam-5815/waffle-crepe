"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/components/motion/motion";
import { useLenis } from "@/components/motion/SmoothScroll";
import { useCart } from "./Cart";

const LOGO = "https://wafflencrepe.com/wp-content/uploads/2020/11/logo_wnc.webp";
const LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/#boxes", label: "Family Boxes" },
  { href: "/visit#catering", label: "Catering" },
  { href: "/visit", label: "Visit" },
];

export default function Nav() {
  const pathname = usePathname();
  const lenis = useLenis();
  const { count } = useCart();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const last = useRef(0);

  useEffect(() => {
    const onScroll = (y: number) => {
      setSolid(y > 40);
      const hide = y > last.current && y > 400;
      setHidden(hide);
      document.documentElement.classList.toggle("nav-hidden", hide);
      last.current = y;
    };
    if (lenis) {
      const handler = ({ scroll }: { scroll: number }) => onScroll(scroll);
      lenis.on("scroll", handler);
      return () => lenis.off("scroll", handler);
    }
    const handler = () => onScroll(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [lenis]);

  // Mobile menu: stop smooth scroll while open, close on Escape or route change.
  useEffect(() => {
    if (open) {
      lenis?.stop();
      const links = menuRef.current?.querySelectorAll("nav a");
      if (links) gsap.fromTo(links, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.06, delay: 0.2, duration: 0.7 });
    } else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, lenis]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => href === pathname;

  return (
    <>
      <header className={`nav${solid ? " is-solid" : ""}${hidden && !open ? " is-hidden" : ""}`} id="top">
        <Link className="nav__logo" href="/" aria-label="Waffle n Crepe home">
          <Image src={LOGO} alt="Waffle n Crepe" width={64} height={64} priority />
        </Link>
        <nav className="nav__links" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>{l.label}</Link>
          ))}
        </nav>
        <div className="nav__actions">
          <Link className="cart" href="/menu#tray" aria-label={`Your order, ${count} items`}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M6 6h15l-1.5 9h-12z M6 6 5 3H2 M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            <span className="cart__count">{count}</span>
          </Link>
          <a className="btn btn--dark nav__order" href="https://wafflencrepe.com/shop/" data-magnetic data-cursor-label="Order">Order now</a>
          <button
            className="burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobileMenu"
            onClick={() => setOpen((o) => !o)}
          >
            <span /><span />
          </button>
        </div>
      </header>

      <div ref={menuRef} className={`mmenu${open ? " open" : ""}`} id="mobileMenu" aria-hidden={!open} inert={!open}>
        <nav aria-label="Mobile">
          <Link href="/">Home</Link>
          {LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </nav>
        <div className="mmenu__foot">
          <a className="btn btn--gold" href="https://wafflencrepe.com/shop/">Order online</a>
          <a href="tel:+97143367664">04 336 7664</a>
        </div>
      </div>
    </>
  );
}
