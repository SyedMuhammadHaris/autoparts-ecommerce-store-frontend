export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> Store in preparation
          </p>
          <h1 id="hero-title">
            The right part.<br /><span>A better drive.</span>
          </h1>
          <p className="hero-description">
            A dedicated destination for automotive parts in Pakistan.
            We’re getting the details right before we open the doors.
          </p>
          <a className="text-link" href="#our-approach">
            A considered approach <span aria-hidden="true">↗</span>
          </a>
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
          The storefront is still in preparation; browsing and ordering will follow.
        </p>
      </section>
    </main>
  );
}
