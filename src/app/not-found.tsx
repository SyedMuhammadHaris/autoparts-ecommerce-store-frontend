import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="state-panel">
      <p className="eyebrow">Page not found</p>
      <h1>Let’s get you<br />back on track.</h1>
      <p>This page isn’t available. You can return to the home page.</p>
      <Link href="/" className="text-link">Back to home <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
