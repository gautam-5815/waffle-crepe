# Waffle n Crepe — website

Animated, 3D redesign of [wafflencrepe.com](https://wafflencrepe.com), built with **Next.js 16** (App Router, Cache Components), **Three.js**, **GSAP + ScrollTrigger** and **Lenis**.

| Route | What it is |
| --- | --- |
| `/` | Home — 3D waffle hero, "Pick your plate" 3D picker, family boxes, breakfast, drinks |
| `/menu` | Full menu with live prices, search, category chips, order tray |
| `/visit` | 3D waffle-grid map, nearest-kitchen finder, contact, delivery, catering form |
| `/api/revalidate` | On-demand menu refresh (for the WooCommerce webhook) |

Menu items, prices and photos come **live from the WooCommerce Store API** on the server, cached for one hour (`lib/menu.ts`). If the shop is unreachable the site falls back to `data/menu-snapshot.json`, so pages always render.

The cart on this site is a **preview** (stored in the browser). Checkout links go to the existing WooCommerce shop.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in REVALIDATE_SECRET
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build` (production build), `npm run start` (serve the build), `npm run lint`.

## Deploy to Vercel

1. **Push this folder to a Git repository** (GitHub, GitLab or Bitbucket). This folder is the repository root.
2. In Vercel, **Add New → Project → Import** that repository. Vercel detects Next.js; keep the default build settings. If you push the parent `waffle-crepe` folder instead, set **Root Directory** to `web`.
3. **Environment variables** (Project → Settings → Environment Variables), for Production and Preview:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://wafflencrepe.com` (or the `*.vercel.app` URL until the domain moves) |
   | `REVALIDATE_SECRET` | A long random string — `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"` |

4. **Deploy.** Every push to the main branch then deploys to production; other branches get preview URLs. Preview deployments are automatically `noindex` (see `app/robots.ts`).

### Pointing the domain at Vercel

The current WordPress shop lives on `wafflencrepe.com`, and this site's checkout links and live menu data depend on it. Pick one before switching DNS:

- **Recommended:** keep WordPress on a subdomain (for example `shop.wafflencrepe.com`), point `wafflencrepe.com` at Vercel, then update `STORE_API` in `lib/menu.ts`, the image host in `next.config.ts`, and the shop links (search the code for `wafflencrepe.com/shop`).
- **Or** launch this site on a subdomain first (for example `new.wafflencrepe.com`) and leave WordPress where it is.

Add the domain under Project → Settings → Domains and follow Vercel's DNS instructions.

### Instant menu updates (optional)

Prices refresh on their own every hour. To refresh as soon as a product changes, in WordPress go to **WooCommerce → Settings → Advanced → Webhooks** and add a webhook for each of *Product created*, *Product updated* and *Product deleted*:

- **Delivery URL:** `https://<your-domain>/api/revalidate?secret=<REVALIDATE_SECRET>`
- **Status:** Active

## Project layout

```
app/                 routes, layout, metadata (sitemap, robots, share image, 404)
  api/revalidate/    on-demand menu refresh
components/
  chrome/            nav, footer, cursor, progress bar, cart + toast
  motion/            Lenis smooth scroll, shared GSAP reveal system
  three/             procedural 3D waffle and waffle-grid city map (Three.js)
  home/ menu/ visit/ page-specific client components
lib/menu.ts          WooCommerce fetch, caching, menu grouping
data/                menu snapshot used as a fallback
```

## Notes for content

- The two Barbie-branded specials in the shop are left out of this site (third-party trademark).
- Opening hours aren't published on the current site, so they aren't shown. Add them to `/visit` once confirmed.
- The 4.9★ Talabat rating and delivery areas come from the current About page — confirm they're up to date.
