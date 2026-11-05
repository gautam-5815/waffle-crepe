// Public URL of the deployed site. NEXT_PUBLIC_SITE_URL wins; otherwise Vercel's production domain
// (set automatically on Vercel), then the brand domain.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : "https://wafflencrepe.com")
).replace(/\/$/, "");
