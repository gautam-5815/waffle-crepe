import Image from "next/image";
import Link from "next/link";
import { getMenu, findItem, groupMenu, money, slugify, type MenuItem } from "@/lib/menu";
import HeroWalkthrough from "@/components/home/HeroWalkthrough";
import PlatePicker, { type PlateOption } from "@/components/home/PlatePicker";
import HomeMotion from "@/components/home/HomeMotion";
import PageMotion from "@/components/motion/PageMotion";
import { AddToCartButton } from "@/components/chrome/Cart";

const UP = "https://wafflencrepe.com/wp-content/uploads/";

// Picker dishes; prices and photos come from the live shop, with pinned fallbacks.
const PLATES: { name: string; fallback: number; img: string }[] = [
  { name: "Lotus Waffle", fallback: 37, img: `${UP}2023/04/lotus-315x473.webp` },
  { name: "Nutty Waffle", fallback: 42, img: `${UP}2023/04/nutt-315x473.webp` },
  { name: "Brownie Waffle", fallback: 47, img: `${UP}2023/04/brow-315x473.webp` },
  { name: "Kinder Pancake", fallback: 42, img: `${UP}2026/08/Kinder-Pancake-315x473.png` },
  { name: "Pistachio Pancake", fallback: 50, img: `${UP}2023/04/pistachio_pan-315x473.webp` },
  { name: "Canadian Pancake", fallback: 38, img: `${UP}2023/04/canadian-1-315x473.webp` },
];

const BREAKFAST = ["Halloumi Waffle", "Egg Waffle", "Tuna Sandwich", "Mixed Cheese Sandwich"];
const DRINKS = [
  { label: "Milkshakes", img: `${UP}2023/04/snikersMil.webp`, cat: "Milk Shakes" },
  { label: "Mojitos", img: `${UP}2023/04/strawberry_mojito.webp`, cat: "Mojito" },
  { label: "Frappe", img: `${UP}2023/04/arabian-frapp.webp`, cat: "Frappe" },
  { label: "Fresh Juice", img: `${UP}2023/04/lemont_minJuce.webp`, cat: "Fresh Juice" },
  { label: "Coffee", img: `${UP}2023/04/sin_esspress.webp`, cat: "Coffee" },
];
const CATS = ["Waffles", "Crepe", "Pancakes", "Mini Pancakes", "Kunafa Specials", "Milk Cakes", "Fresh Juice", "Mojito", "Milk Shakes", "Frappe", "Coffee"];
const MARQUEE = ["Waffles", "Crepes", "Pancakes", "Mini Pancakes", "Milk Cakes", "Milkshakes", "Mojitos", "Frappe", "Coffee", "Fresh Juice"];

const pct = (i: MenuItem) => Math.round((1 - i.price / i.was) * 100);

export default async function Home() {
  const menu = await getMenu();
  const plates: PlateOption[] = PLATES.map((p) => {
    const live = findItem(menu, p.name);
    return { name: p.name, price: live?.price ?? p.fallback, img: live?.img || p.img };
  });
  const boxes = menu.filter((m) => m.cats.includes("Sharing Box")).sort((a, b) => Number(b.was > b.price) - Number(a.was > a.price));
  // Same grouping the menu page uses, so the home counts and anchors match what
  // a visitor lands on. Raw item.cats undercounts: uncategorised shop items are
  // folded into Waffles by groupMenu, not by the feed.
  const cats = Object.fromEntries(
    groupMenu(menu).flatMap((g) => g.cats.map((c) => [c.key, c] as const))
  );
  const breakfast = BREAKFAST.map((n) => findItem(menu, n)).filter((m): m is MenuItem => !!m);

  return (
    <div className="page-home">
      <HeroWalkthrough />

      {/* The walkthrough carries no text, so the page's opening copy lives here. */}
      <section className="intro">
        <p className="eyebrow" data-reveal>Dubai Silicon Oasis · The Sustainable City</p>
        <h1 className="intro__title" data-motion-text>Golden grids, <em>made to order.</em></h1>
        <p className="intro__sub" data-reveal>
          Waffles, crepes and pancakes cooked the moment you order — with shakes, mojitos and
          coffee to match. Delivered across Dubai.
        </p>
        <div className="intro__ctas" data-reveal>
          <a className="btn btn--gold" href="https://wafflencrepe.com/shop/" data-magnetic data-cursor-label="Shop">Order online</a>
          <Link className="btn btn--line" href="/menu" data-magnetic>See the menu</Link>
        </div>
        <p className="intro__offer" data-reveal><strong>Buy 2, get 1 free</strong> every weekday*</p>
      </section>

      <div className="marquee" aria-label="What we make">
        <div className="marquee__track">
          {[0, 1].map((copy) =>
            MARQUEE.map((m) => (
              <span key={`${copy}-${m}`} className="marquee__item" aria-hidden={copy === 1}>
                <span>{m}</span><i />
              </span>
            ))
          )}
        </div>
      </div>

      <PlatePicker options={plates} />

      <section className="story" data-parallax-section>
        <div className="story__copy">
          <p className="eyebrow" data-reveal>Made to order</p>
          <h2 className="story__title" data-motion-text>Pressed fresh, <em>never waiting.</em></h2>
          <p className="story__lead" data-reveal>
            Nothing sits under a lamp. Every waffle, crepe and pancake goes on the iron the moment the
            order lands, and the coffee bar runs alongside it — shakes, mojitos, frappes and espresso,
            poured to match.
          </p>
          <p className="story__lead" data-reveal>
            Two kitchens in Dubai, one phone number, and delivery across the city.
          </p>
          <Link className="btn btn--line btn--light" href="/visit" data-magnetic data-reveal>Find a kitchen</Link>
        </div>
        {/* 1536px intermediates, not the 1800-2000px originals: the shop origin is slow
            enough that optimising the full files can time out. */}
        <div className="story__grid">
          <figure className="story__fig story__fig--a" data-image-reveal>
            <Image src={`${UP}2023/10/waffle_crepe_breakfast__0002_RKW06191-1536x1536.jpg`} alt="A halloumi waffle served with rocket, tomato and dressing" width={1536} height={1536} sizes="(max-width: 900px) 92vw, 34vw" data-parallax-img />
          </figure>
          <figure className="story__fig story__fig--b" data-image-reveal>
            <Image src={`${UP}2023/04/RKW05711-1536x1024.jpg`} alt="A layered iced latte beside a cup of coffee beans" width={1536} height={1024} sizes="(max-width: 900px) 46vw, 22vw" data-parallax-img />
          </figure>
          <figure className="story__fig story__fig--c" data-image-reveal>
            <Image src={`${UP}2024/02/RKW05738-1536x1024.jpg`} alt="A cappuccino dusted with chocolate on a white saucer" width={1536} height={1024} sizes="(max-width: 900px) 46vw, 22vw" data-parallax-img />
          </figure>
        </div>
      </section>

      <section className="offer" data-parallax-section>
        <div className="offer__waffle" aria-hidden="true" data-parallax-layer data-parallax-speed="0.25" />
        <p className="eyebrow" data-reveal>Monday to Friday</p>
        <h2 className="offer__title" data-motion-text>Buy two. The third <em>is on us.</em></h2>
        <p className="offer__note" data-reveal>Order any two and get a third free on weekdays. *Terms apply in store and online.</p>
        <a className="btn btn--dark" href="https://wafflencrepe.com/shop/" data-magnetic data-reveal>Claim the offer</a>
      </section>

      <section className="boxes" id="boxes" data-horizontal-gallery>
        <div className="boxes__track" data-horizontal-track>
          <div className="boxes__intro">
            <p className="eyebrow">Sharing, sorted</p>
            <h2 className="h2">Family boxes<br /><em>for the whole table.</em></h2>
            <p className="lead">Built for birthdays, office mornings and movie nights.</p>
            <p className="boxes__scroll" aria-hidden="true">Scroll →</p>
          </div>
          {boxes.map((b) => (
            <article className="box" data-tilt data-card key={b.name}>
              <figure><Image src={b.img} alt={b.name} width={315} height={473} sizes="(max-width: 760px) 70vw, 26vw" /></figure>
              {b.was > b.price && <span className="box__tag">-{pct(b)}%</span>}
              <h3>{b.name}</h3>
              <p className="box__price"><strong>AED {money(b.price)}</strong>{b.was > b.price && <> <s>{money(b.was)}</s></>}</p>
              <AddToCartButton name={b.name} price={b.price} />
            </article>
          ))}
        </div>
      </section>

      <section className="breakfast" id="breakfast">
        <div className="breakfast__head">
          <p className="eyebrow" data-reveal>New · All day</p>
          <h2 className="h2" data-motion-text>Savoury mornings, <em>crisp edges.</em></h2>
        </div>
        <div className="breakfast__grid" data-reveal-group>
          {breakfast.map((d, i) => (
            <article className={`dish${i === 0 || i === 3 ? " dish--tall" : ""}`} data-reveal-item key={d.name}>
              <figure data-image-reveal><Image src={d.img} alt={d.name} width={315} height={473} sizes="(max-width: 860px) 50vw, 25vw" /></figure>
              <div><h3>{d.name}</h3><p>AED {money(d.price)}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="drinks" id="drinks">
        <h2 className="drinks__title" data-motion-text>Something cold <em>on the side.</em></h2>
        <div className="drinks__row" data-reveal-group>
          {DRINKS.map((d) => (
            <Link href={`/menu#${slugify(d.cat)}`} className="drink" data-reveal-item data-tilt key={d.label}>
              <Image src={d.img} alt="" width={400} height={400} sizes="(max-width: 860px) 50vw, 20vw" />
              <span className="drink__cap">{d.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="cats">
        <div className="cats__head">
          <h2 className="h2" data-motion-text>The whole <em>grid.</em></h2>
          <p className="cats__lead" data-reveal>
            Eleven categories, {menu.length} dishes and drinks — every one cooked to order.
          </p>
        </div>
        <ul className="cats__grid" data-reveal-group>
          {CATS.map((c) => cats[c]).filter(Boolean).map((c) => (
            <li data-reveal-item key={c.key}>
              <Link href={`/menu#${c.slug}`}>
                <span className="cats__name">{c.label}</span>
                <span className="cats__n">{c.items.length}</span>
              </Link>
            </li>
          ))}
          <li data-reveal-item className="cats__cta">
            <Link href="/menu">
              <span className="cats__name">See the full menu</span>
              <span className="cats__arrow" aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="visit" id="visit">
        <h2 className="visit__title" data-motion-text>Two kitchens. <em>One phone number.</em></h2>
        <div className="visit__cards" data-reveal-group>
          <article className="loc" data-reveal-item>
            <span className="loc__n">01</span>
            <h3>Dubai Silicon Oasis</h3>
            <p>Shop 02, Millennium Tower, Uni Estate, Dubai Silicon Oasis</p>
            <Link href="/visit#dso" data-cursor-label="Map">Directions →</Link>
          </article>
          <article className="loc" data-reveal-item>
            <span className="loc__n">02</span>
            <h3>The Sustainable City</h3>
            <p>Block D1, Store R1, Sustainable City Plaza, Dubai</p>
            <Link href="/visit#tsc" data-cursor-label="Map">Directions →</Link>
          </article>
          <article className="loc loc--call" data-reveal-item>
            <span className="loc__n">Call</span>
            <a className="loc__phone" href="tel:+97143367664">04 336 7664</a>
            <p>Orders, catering and events.</p>
            <Link href="/visit">Everything about visiting →</Link>
          </article>
        </div>
      </section>

      <HomeMotion />
      <PageMotion scope=".page-home" />
    </div>
  );
}
