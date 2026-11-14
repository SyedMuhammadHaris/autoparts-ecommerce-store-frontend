"use client";

import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main id="main-content" className="state-panel">
      <h1>Something went wrong.</h1>
      <p>Please try again or return to the home page.</p>
      <button onClick={reset}>Try again</button>
      <p><Link href="/">Back to home</Link></p>
    </main>
  );
}
