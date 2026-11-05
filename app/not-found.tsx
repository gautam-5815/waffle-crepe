import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="notfound">
      <div className="notfound__grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => <i key={i} className={i === 4 ? "is-empty" : undefined} />)}
      </div>
      <p className="eyebrow">404</p>
      <h1 className="h2">This square is <em>empty.</em></h1>
      <p className="lead">The page you’re after isn’t on the grid. The waffles are, though.</p>
      <div className="notfound__ctas">
        <Link className="btn btn--dark" href="/menu">See the menu</Link>
        <Link className="btn btn--line" href="/">Back home</Link>
      </div>
    </section>
  );
}
