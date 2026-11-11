import type { Metadata } from "next";
import Image from "next/image";
import VisitKitchens from "@/components/visit/VisitKitchens";
import CateringForm from "@/components/visit/CateringForm";
import PageMotion from "@/components/motion/PageMotion";
import "./visit.css";

const UP = "https://wafflencrepe.com/wp-content/uploads/";

export const metadata: Metadata = {
  title: "Visit — Silicon Oasis & The Sustainable City",
  description: "Find Waffle n Crepe in Dubai Silicon Oasis and The Sustainable City. Directions, phone, email, delivery and event catering.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant", name: "Waffle n Crepe — Dubai Silicon Oasis", servesCuisine: ["Desserts", "Breakfast", "Coffee"],
      telephone: "+97143367664", email: "info@wafflencrepe.com", url: "https://wafflencrepe.com/",
      address: { "@type": "PostalAddress", streetAddress: "Shop 02, Millennium Tower, Uni Estate", addressLocality: "Dubai Silicon Oasis, Dubai", addressCountry: "AE" },
      geo: { "@type": "GeoCoordinates", latitude: 25.1213, longitude: 55.3728 },
    },
    {
      "@type": "Restaurant", name: "Waffle n Crepe — The Sustainable City", servesCuisine: ["Desserts", "Breakfast", "Coffee"],
      telephone: "+97143367664", email: "info@wafflencrepe.com", url: "https://wafflencrepe.com/",
      address: { "@type": "PostalAddress", streetAddress: "Block D1, Store R1, Sustainable City Plaza, Wadi Al Safa 7", addressLocality: "The Sustainable City, Dubai", addressCountry: "AE" },
    },
  ],
};

export default function VisitPage() {
  return (
    <div className="page-visit">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VisitKitchens />

      <section className="reach">
        <h2 className="reach__title" data-motion-text>Get in touch, <em>any way you like.</em></h2>
        <div className="reach__grid" data-reveal-group>
          <a className="reach__item" href="tel:+97143367664" data-reveal-item data-tilt><span>Landline</span><strong>04 336 7664</strong><em>Orders &amp; catering</em></a>
          <a className="reach__item" href="tel:+971544844251" data-reveal-item data-tilt><span>Hotline</span><strong>054 484 4251</strong><em>Mobile</em></a>
          <a className="reach__item" href="mailto:info@wafflencrepe.com" data-reveal-item data-tilt><span>Email</span><strong>info@<wbr />wafflencrepe.com</strong><em>Questions, collabs, feedback</em></a>
          <a className="reach__item reach__item--gold" href="https://www.instagram.com/wafflencrepe/" target="_blank" rel="noopener" data-reveal-item data-tilt><span>Instagram</span><strong>@wafflencrepe</strong><em>Share your plate</em></a>
        </div>
      </section>

      <section className="deliver">
        <div className="deliver__copy">
          <p className="eyebrow" data-reveal>Delivery</p>
          <h2 className="h2" data-motion-text>Hot to your <em>door.</em></h2>
          <p className="lead" data-reveal>Order on our shop and we bring it over. We deliver to neighbourhoods around both kitchens, including:</p>
          <ul className="areas" data-reveal-group>
            {["Dubai Silicon Oasis", "The Sustainable City", "Arabian Ranches", "Dubai Marina"].map((a) => <li data-reveal-item key={a}>{a}</li>)}
          </ul>
          <a className="btn btn--dark" href="https://wafflencrepe.com/shop/" data-magnetic data-reveal>Order online</a>
        </div>
        <div className="deliver__badge" data-reveal>
          <strong>4.9<span>★</span></strong>
          <p>rating on Talabat</p>
        </div>
      </section>

      <section className="catershots" aria-label="Sharing boxes we bring to events">
        <figure className="catershot" data-image-reveal>
          <Image src={`${UP}2023/04/FamilyBox.webp`} alt="An assorted family box of waffles, crepes and fruit" width={1000} height={1000} sizes="(max-width: 900px) 92vw, 33vw" data-parallax-img />
        </figure>
        <figure className="catershot" data-image-reveal>
          <Image src={`${UP}2023/04/browniBox.webp`} alt="A box of brownies cut and arranged in rows" width={1000} height={1000} sizes="(max-width: 900px) 92vw, 33vw" data-parallax-img />
        </figure>
        <figure className="catershot" data-image-reveal>
          <Image src={`${UP}2023/04/asstsushi.webp`} alt="An assorted box of rolled sushi crepes" width={1000} height={1000} sizes="(max-width: 900px) 92vw, 33vw" data-parallax-img />
        </figure>
      </section>

      <section className="cater" id="catering">
        <div className="cater__intro">
          <p className="eyebrow" data-reveal>Events &amp; catering</p>
          <h2 className="cater__title" data-motion-text>Bring the waffle iron <em>to your party.</em></h2>
          <p className="lead" data-reveal>Corporate mornings, birthdays, weddings and everything between. Packages are flexible — built around your guest count, dietary needs and budget.</p>
          <ul className="cater__list" data-reveal-group>
            <li data-reveal-item><b>01</b> Tell us the date and headcount</li>
            <li data-reveal-item><b>02</b> We shape a menu with you</li>
            <li data-reveal-item><b>03</b> We cook and serve on the day</li>
          </ul>
        </div>
        <CateringForm />
      </section>

      <PageMotion scope=".page-visit" />
    </div>
  );
}
