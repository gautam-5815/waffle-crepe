import { cacheLife, cacheTag } from "next/cache";
import snapshot from "@/data/menu-snapshot.json";

export type MenuItem = {
  name: string;
  price: number;
  was: number;
  cats: string[];
  img: string;
  note: string;
  url: string;
  options: boolean;
};

export type MenuCategory = { key: string; slug: string; label: string; line: string; items: MenuItem[] };
export type MenuGroup = { title: string; cats: MenuCategory[] };

const STORE_API = "https://wafflencrepe.com/wp-json/wc/store/v1/products";

const decode = (s = "") =>
  s
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&#[0-9]+;/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type StoreProduct = {
  name: string;
  type: string;
  permalink: string;
  short_description?: string;
  prices: { price: string; regular_price: string; currency_minor_unit: number };
  categories?: { name: string }[];
  images?: { thumbnail?: string }[];
};

/**
 * Live catalogue from the WooCommerce Store API, cached for an hour.
 * Falls back to the bundled snapshot if the shop is unreachable, so pages always render.
 */
export async function getMenu(): Promise<MenuItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("menu");

  try {
    const all: StoreProduct[] = [];
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(`${STORE_API}?per_page=100&page=${page}`, { headers: { "User-Agent": "wafflencrepe-web" } });
      if (!res.ok) throw new Error(`Store API ${res.status}`);
      const batch = (await res.json()) as StoreProduct[];
      if (!batch.length) break;
      all.push(...batch);
    }
    const items = all
      .map((p) => {
        const unit = 10 ** (p.prices.currency_minor_unit ?? 2);
        return {
          name: decode(p.name),
          price: Number(p.prices.price) / unit,
          was: Number(p.prices.regular_price) / unit,
          cats: (p.categories ?? []).map((c) => decode(c.name)).filter(Boolean),
          img: p.images?.[0]?.thumbnail ?? "",
          note: decode(p.short_description).slice(0, 80),
          url: p.permalink,
          options: p.type === "variable",
        };
      })
      // Barbie-branded specials are a third-party trademark; keep them off the redesign.
      .filter((i) => !i.cats.includes("Barbie Specials") && !/barbie/i.test(i.name));
    return items.length ? items : (snapshot as MenuItem[]);
  } catch {
    return snapshot as MenuItem[];
  }
}

export const GROUPS: { title: string; cats: string[] }[] = [
  { title: "Plates", cats: ["Waffles", "Crepe", "Pancakes", "Mini Pancakes", "Kunafa Specials", "Breakfast", "Sharing Box"] },
  { title: "Sweets", cats: ["Bliss in A Cup", "Pastries", "Milk Cakes"] },
  { title: "Sips", cats: ["Milk Shakes", "Frappe", "Smoothies", "Mojito", "Fresh Juice", "Iced Coffee", "Coffee", "Latte", "Affogato", "Tea", "Other"] },
];

const META: Record<string, [string, string]> = {
  Waffles: ["Waffles", "Pressed to order. Crisp grid, soft middle."],
  Crepe: ["Crepes", "Thin, folded and properly loaded."],
  Pancakes: ["Pancakes", "Tall stacks with the good toppings."],
  "Mini Pancakes": ["Mini Pancakes", "Bite-size and made for sharing."],
  "Kunafa Specials": ["Kunafa Specials", "Crunchy kunafa meets waffle and crepe."],
  Breakfast: ["Breakfast", "Savoury plates for mornings and after."],
  "Sharing Box": ["Sharing Boxes", "For the whole table — on offer now."],
  "Bliss in A Cup": ["Bliss in a Cup", "Brownie, kunafa and cream, layered."],
  Pastries: ["Pastries", "Brownies for the road."],
  "Milk Cakes": ["Milk Cakes", "Soaked, chilled and sweet."],
  "Milk Shakes": ["Milkshakes", "Thick, cold, candy-bar loaded."],
  Frappe: ["Frappe", "Blended iced coffee."],
  Smoothies: ["Smoothies", "Fruit and ice, nothing fussy."],
  Mojito: ["Mojitos", "Fizzy, minty, bright."],
  "Fresh Juice": ["Fresh Juice", "Squeezed fresh."],
  "Iced Coffee": ["Iced Coffee", "Cold coffee, flavoured your way."],
  Coffee: ["Coffee", "The espresso bar classics."],
  Latte: ["Lattes", "Milky, smooth, flavoured."],
  Affogato: ["Affogato", "Espresso poured over ice cream."],
  Tea: ["Tea", "A cup of something calm."],
  Other: ["Also", "Hot chocolate and water."],
};

export const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Each item lives in the first category (in menu order) it belongs to. Uncategorised shop items are all waffles. */
export function groupMenu(menu: MenuItem[]): MenuGroup[] {
  const order = GROUPS.flatMap((g) => g.cats);
  const byCat: Record<string, MenuItem[]> = Object.fromEntries(order.map((c) => [c, []]));
  for (const item of menu) {
    let cats = item.cats.map((c) => (c === "Smoothies On Offer" ? "Smoothies" : c));
    if (!cats.length) cats = ["Waffles"];
    const home = order.find((c) => cats.includes(c));
    if (home) byCat[home].push(item);
  }
  for (const list of Object.values(byCat)) {
    list.sort((a, b) => Number(b.was > b.price) - Number(a.was > a.price) || Number(!!b.img) - Number(!!a.img));
  }
  return GROUPS.map((g) => ({
    title: g.title,
    cats: g.cats
      .filter((c) => byCat[c].length)
      .map((c) => ({ key: c, slug: slugify(c), label: META[c][0], line: META[c][1], items: byCat[c] })),
  })).filter((g) => g.cats.length);
}

export const money = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

export function findItem(menu: MenuItem[], name: string) {
  return menu.find((m) => m.name.toLowerCase() === name.toLowerCase());
}
