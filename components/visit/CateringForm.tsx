"use client";

import { useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/components/motion/motion";
import { useCart } from "@/components/chrome/Cart";

/** Event enquiry that drafts a pre-filled email to info@ — no server needed. */
export default function CateringForm() {
  const form = useRef<HTMLFormElement>(null);
  const { toast } = useCart();
  const [msg, setMsg] = useState({ text: "Opens your email app with everything filled in, addressed to info@wafflencrepe.com.", error: false });
  const [invalid, setInvalid] = useState<string[]>([]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const el = form.current!;
    const f = Object.fromEntries(new FormData(el)) as Record<string, string>;
    const missing = ["name", "date", "guests"].filter((k) => !f[k]?.trim() || (k === "guests" && Number(f[k]) < 1));
    setInvalid(missing);
    if (missing.length) {
      setMsg({ text: "Please add your name, the date and the number of guests.", error: true });
      el.querySelector<HTMLElement>(`[name="${missing[0]}"]`)?.focus();
      if (!prefersReducedMotion()) gsap.fromTo(el, { x: -10 }, { x: 0, duration: 0.6, ease: "power3.out" });
      return;
    }
    const date = new Date(`${f.date}T12:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
    const subject = `Event catering enquiry — ${f.type}, ${date}, ${f.guests} guests`;
    const body = `Hi Waffle n Crepe team,\n\nI'd like to ask about catering for an event.\n\nName: ${f.name}\nType: ${f.type}\nDate: ${date}\nGuests: ${f.guests}\n\n${f.notes ? `Notes: ${f.notes}\n\n` : ""}Thanks!`;
    window.location.href = `mailto:info@wafflencrepe.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMsg({ text: "Your email app should open now — just press send.", error: false });
    toast("Email drafted — check your mail app");
  };

  const inv = (k: string) => (invalid.includes(k) ? true : undefined);
  return (
    <form className="cater__form" ref={form} onSubmit={submit} noValidate data-reveal>
      <p className="cater__formhead">Plan an event</p>
      <label>Your name<input name="name" autoComplete="name" required aria-invalid={inv("name")} /></label>
      <div className="cater__row">
        <label>Event date<input name="date" type="date" required aria-invalid={inv("date")} /></label>
        <label>Guests<input name="guests" type="number" min={5} step={1} inputMode="numeric" placeholder="30" required aria-invalid={inv("guests")} /></label>
      </div>
      <label>Type of event
        <select name="type" defaultValue="Corporate">
          <option>Corporate</option><option>Birthday</option><option>Wedding</option><option>School / community</option><option>Something else</option>
        </select>
      </label>
      <label>Anything else?<textarea name="notes" rows={3} placeholder="Venue, dietary needs, favourite items…" /></label>
      <button className="btn btn--gold" type="submit" data-magnetic>Write the email →</button>
      <p className={`cater__fine${msg.error ? " is-error" : ""}`} aria-live="polite">{msg.text}</p>
    </form>
  );
}
