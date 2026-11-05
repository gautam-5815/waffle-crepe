import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/motion/SmoothScroll";
import CartProvider from "@/components/chrome/Cart";
import Nav from "@/components/chrome/Nav";
import Footer from "@/components/chrome/Footer";
import { Cursor, Progress } from "@/components/chrome/Effects";
import { FooterMotion } from "@/components/motion/PageMotion";
import { SITE_URL } from "@/lib/site";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Waffle n Crepe Dubai — Waffles, Crepes, Pancakes & Shakes", template: "%s — Waffle n Crepe Dubai" },
  description: "Fresh waffles, crepes, pancakes, mini pancakes and milkshakes in Dubai Silicon Oasis and The Sustainable City. Order online.",
  icons: { icon: "https://wafflencrepe.com/wp-content/uploads/2020/11/logo_wnc.webp" },
  openGraph: { siteName: "Waffle n Crepe", locale: "en_AE", type: "website" },
};

export const viewport: Viewport = { themeColor: "#FFB81C" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable}`}>
      <body>
        <SmoothScroll>
          <CartProvider>
            <a className="skip" href="#main">Skip to content</a>
            <Cursor />
            <Progress />
            <Nav />
            <main id="main">{children}</main>
            <Footer />
            <FooterMotion />
          </CartProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
