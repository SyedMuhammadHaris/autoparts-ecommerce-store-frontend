import Link from "next/link";

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> Automotive parts · Pakistan</p>
          <h1 id="hero-title">
            The right part.<br /><span>A better drive.</span>
          </h1>
          <p className="hero-description">
            A dedicated destination for automotive parts in Pakistan.
            Explore the catalog and find the right option for your vehicle.
          </p>
          <Link className="text-link" href="/products">Explore parts <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="road-art" aria-hidden="true">
          <span className="art-label">FOR THE ROAD AHEAD</span>
          <div className="road-track">
            <div className="road-line" />
          </div>
          <span className="art-caption">Precision in every detail.</span>
          <span className="art-number">01 / PK</span>
        </div>
      </section>
      <section className="approach" id="our-approach" aria-labelledby="approach-title">
        <div>
          <p className="eyebrow">Our direction</p>
          <h2 id="approach-title">Less guesswork.<br />More confidence.</h2>
        </div>
        <p>
          We’re building a clear, considered way to explore automotive parts.
          Browse product options and availability, build your cart and review delivery at checkout.
        </p>
      </section>
    </main>
  );
}
