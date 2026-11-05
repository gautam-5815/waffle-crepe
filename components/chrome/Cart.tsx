"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/components/motion/motion";

// Preview cart: shared across pages via localStorage. Real checkout lives on the WooCommerce shop.
type Line = { name: string; price: number; qty: number };
type CartApi = {
  items: Line[];
  count: number;
  total: number;
  add: (item: { name: string; price: number; imgEl?: HTMLImageElement | null }) => void;
  clear: () => void;
  toast: (msg: string) => void;
};

const KEY = "wnc-preview-cart";
const CartContext = createContext<CartApi | null>(null);

// Tiny external store so React reads localStorage without effects (and the server always sees an empty cart).
const EMPTY: Line[] = [];
let lines: Line[] | null = null;
const subs = new Set<() => void>();
const store = {
  get(): Line[] {
    if (lines === null) {
      try { lines = JSON.parse(localStorage.getItem(KEY) || "[]") as Line[]; } catch { lines = []; }
    }
    return lines;
  },
  set(next: Line[]) {
    lines = next;
    localStorage.setItem(KEY, JSON.stringify(next));
    subs.forEach((f) => f());
  },
  subscribe(f: () => void) {
    subs.add(f);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) { lines = null; f(); } }; // sync other tabs
    window.addEventListener("storage", onStorage);
    return () => { subs.delete(f); window.removeEventListener("storage", onStorage); };
  },
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

function flyToCart(imgEl: HTMLImageElement, onLand: () => void) {
  const cartEl = document.querySelector(".cart");
  if (!cartEl) return onLand();
  document.querySelector(".nav")?.classList.remove("is-hidden");
  const from = imgEl.getBoundingClientRect();
  const to = cartEl.getBoundingClientRect();
  const fly = document.createElement("img");
  fly.src = imgEl.currentSrc || imgEl.src;
  fly.className = "flyer";
  fly.alt = "";
  document.body.appendChild(fly);
  const x0 = from.left + from.width / 2 - 32, y0 = from.top + from.height / 2 - 32;
  const x1 = to.left + to.width / 2 - 32, y1 = to.top + to.height / 2 - 32;
  gsap.set(fly, { x: x0, y: y0, scale: 1.4 });
  gsap
    .timeline({ onComplete: () => { fly.remove(); onLand(); } })
    .to(fly, { x: x1, duration: 0.8, ease: "power2.inOut" }, 0)
    .to(fly, { y: Math.min(y0, y1) - 120, duration: 0.4, ease: "power2.out" }, 0)
    .to(fly, { y: y1, duration: 0.4, ease: "power2.in" }, 0.4)
    .to(fly, { scale: 0.3, autoAlpha: 0.6, duration: 0.8, ease: "power2.in" }, 0);
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(store.subscribe, store.get, () => EMPTY);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastOn(false), 2200);
  }, []);

  const add = useCallback<CartApi["add"]>(({ name, price, imgEl }) => {
    // Update the order immediately; the flying photo is only decoration.
    const prev = store.get();
    const found = prev.find((i) => i.name === name);
    store.set(found ? prev.map((i) => (i === found ? { ...i, qty: i.qty + 1 } : i)) : [...prev, { name, price: Number(price) || 0, qty: 1 }]);
    toast(`${name} added to your cart`);
    const bump = () => {
      const c = document.querySelector(".cart");
      c?.classList.remove("bump");
      void (c as HTMLElement | null)?.offsetWidth;
      c?.classList.add("bump");
    };
    if (imgEl && !prefersReducedMotion()) flyToCart(imgEl, bump);
    else bump();
  }, [toast]);

  const api = useMemo<CartApi>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((n, i) => n + i.qty * i.price, 0),
    add,
    clear: () => store.set([]),
    toast,
  }), [items, add, toast]);

  return (
    <CartContext.Provider value={api}>
      {children}
      <div className={`toast${toastOn ? " show" : ""}`} role="status" aria-live="polite">{toastMsg}</div>
    </CartContext.Provider>
  );
}

/** Button that adds an item and flies the nearest card photo into the cart. */
export function AddToCartButton({ name, price, className = "btn btn--small", children, label }: {
  name: string; price: number; className?: string; children?: ReactNode; label?: string;
}) {
  const { add } = useCart();
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={(e) => {
        const card = (e.currentTarget as HTMLElement).closest("[data-card]");
        add({ name, price, imgEl: card?.querySelector("img") ?? null });
      }}
    >
      {children ?? "Add to cart"}
    </button>
  );
}
