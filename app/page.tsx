import Image from "next/image";
import Link from "next/link";
import { getMenu, findItem, money, slugify, type MenuItem } from "@/lib/menu";
import HomeHero from "@/components/home/HomeHero";
import PlatePicker, { type PlateOption } from "@/components/home/PlatePicker";
import HomeMotion from "@/components/home/HomeMotion";
import PageMotion from "@/components/motion/PageMotion";
import { AddToCartButton } from "@/components/chrome/Cart";

const UP = "https://wafflencrepe.com/wp-content/uploads/";

// Picker dishes map to 3D topping presets; prices and photos come from the live shop.
const PLATES: { preset: string; name: string; fallback: number; img: string }[] = [
  { preset: "lotus", name: "Lotus Waffle", fallback: 37, img: `${UP}2023/04/lotus-315x473.webp` },
  { preset: "nutty", name: "Nutty Waffle", fallback: 42, img: `${UP}2023/04/nutt-315x473.webp` },
  { preset: "brownie", name: "Brownie Waffle", fallback: 47, img: `${UP}2023/04/brow-315x473.webp` },
  { preset: "kinder", name: "Kinder Pancake", fallback: 42, img: `${UP}2026/08/Kinder-Pancake-315x473.png` },
  { preset: "pistachio", name: "Pistachio Pancake", fallback: 50, img: `${UP}2023/04/pistachio_pan-315x473.webp` },
  { preset: "canadian", name: "Canadian Pancake", fallback: 38, img: `${UP}2023/04/canadian-1-315x473.webp` },
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
    return { preset: p.preset, name: p.name, price: live?.price ?? p.fallback, img: live?.img || p.img };
  });
  const boxes = menu.filter((m) => m.cats.includes("Sharing Box")).sort((a, b) => Number(b.was > b.price) - Number(a.was > a.price));
  const breakfast = BREAKFAST.map((n) => findItem(menu, n)).filter((m): m is MenuItem => !!m);

  return (
    <div className="page-home">
      <HomeHero />

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
        <h2 className="h2" data-motion-text>The whole <em>grid.</em></h2>
        <ul className="cats__grid" data-reveal-group>
          {CATS.map((c) => (
            <li data-reveal-item key={c}><Link href={`/menu#${slugify(c)}`}>{c === "Crepe" ? "Crepes" : c === "Milk Shakes" ? "Milkshakes" : c}</Link></li>
          ))}
          <li data-reveal-item className="cats__cta"><Link href="/menu">See the full menu →</Link></li>
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
