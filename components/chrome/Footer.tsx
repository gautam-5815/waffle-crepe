import Link from "next/link";

export default function Footer() {
  return (
    <footer className="foot">
      <p className="foot__big" aria-hidden="true">Waffle n Crepe</p>
      <div className="foot__row">
        <p>© 2026 Waffle &amp; Crepe FZE. Prices are from the online shop and may change.</p>
        <nav aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/menu">Menu</Link>
          <Link href="/visit">Visit</Link>
          <a href="https://wafflencrepe.com/promotions/">Promotions</a>
          <a href="https://wafflencrepe.com/return-policy/">Return policy</a>
          <a href="https://www.instagram.com/wafflencrepe/" target="_blank" rel="noopener">Instagram</a>
          <a href="https://www.facebook.com/wafflencrepe/" target="_blank" rel="noopener">Facebook</a>
        </nav>
      </div>
    </footer>
  );
}
