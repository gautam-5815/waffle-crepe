import type { Metadata } from "next";
import { getMenu, groupMenu, findItem } from "@/lib/menu";
import MenuClient, { type NowItem } from "@/components/menu/MenuClient";
import "./menu.css";

export const metadata: Metadata = {
  title: "Menu",
  description: "The full Waffle n Crepe menu with live prices: waffles, crepes, pancakes, mini pancakes, kunafa specials, breakfast, sharing boxes, milkshakes, coffee and more.",
};

// Signature waffles shown in the hero, photographed; names must match the shop.
const NOW = ["Lotus Waffle", "Nutty Waffle", "Brownie Waffle", "Pistachio Waffle", "Kinder Waffle", "Mix Berries Waffle", "Canadian Waffle"];

export default async function MenuPage() {
  const menu = await getMenu();
  const groups = groupMenu(menu);
  const now: NowItem[] = NOW.flatMap((name) => {
    const item = findItem(menu, name);
    return item?.img ? [{ name: item.name, price: item.price, img: item.img }] : [];
  });
  const prices = menu.map((m) => m.price).filter(Boolean);
  const stats = {
    items: groups.reduce((n, g) => n + g.cats.reduce((k, c) => k + c.items.length, 0), 0),
    cats: groups.reduce((n, g) => n + g.cats.length, 0),
    from: Math.min(...prices),
  };
  return <MenuClient groups={groups} now={now} stats={stats} />;
}
