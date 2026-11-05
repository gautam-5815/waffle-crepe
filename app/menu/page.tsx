import type { Metadata } from "next";
import { getMenu, groupMenu, findItem } from "@/lib/menu";
import MenuClient, { type NowItem } from "@/components/menu/MenuClient";
import "./menu.css";

export const metadata: Metadata = {
  title: "Menu",
  description: "The full Waffle n Crepe menu with live prices: waffles, crepes, pancakes, mini pancakes, kunafa specials, breakfast, sharing boxes, milkshakes, coffee and more.",
};

// Real waffles on the menu, each paired with a 3D topping preset for the hero.
const NOW: [string, string][] = [
  ["lotus", "Lotus Waffle"], ["nutty", "Nutty Waffle"], ["brownie", "Brownie Waffle"], ["pistachio", "Pistachio Waffle"],
  ["kinder", "Kinder Waffle"], ["berry", "Mix Berries Waffle"], ["canadian", "Canadian Waffle"],
];

export default async function MenuPage() {
  const menu = await getMenu();
  const groups = groupMenu(menu);
  const now: NowItem[] = NOW.flatMap(([preset, name]) => {
    const item = findItem(menu, name);
    return item ? [{ preset, name: item.name, price: item.price }] : [];
  });
  const prices = menu.map((m) => m.price).filter(Boolean);
  const stats = {
    items: groups.reduce((n, g) => n + g.cats.reduce((k, c) => k + c.items.length, 0), 0),
    cats: groups.reduce((n, g) => n + g.cats.length, 0),
    from: Math.min(...prices),
  };
  return <MenuClient groups={groups} now={now} stats={stats} />;
}
