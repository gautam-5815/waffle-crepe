import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

/**
 * On-demand menu refresh. Point a WooCommerce webhook (Product created/updated/deleted) at:
 *   POST https://<your-domain>/api/revalidate?secret=<REVALIDATE_SECRET>
 * Prices otherwise refresh on their own every hour.
 */
function validSecret(given: string | null) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") ?? request.headers.get("x-revalidate-secret");
  if (!validSecret(secret)) {
    return Response.json({ ok: false, error: "Invalid or missing secret" }, { status: 401 });
  }
  // Stale-while-revalidate: visitors keep seeing the old menu while the new one loads.
  revalidateTag("menu", "max");
  return Response.json({ ok: true, revalidated: "menu", at: new Date().toISOString() });
}

// WooCommerce pings the URL with a GET when you save a webhook; answer so it can be saved.
export function GET() {
  return Response.json({ ok: true, hint: "POST with ?secret=… to refresh the menu" });
}
