"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError, type User } from "@/lib/api";
import type { Page } from "@/lib/catalog-types";
import { ReviewForm } from "./review-form";
import type { ProductReview, OwnReview } from "./types";

export function ProductReviews({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const reviews = useApiQuery<Page<ProductReview> & { average: string | null }>({ path: "/api/reviews/{slug}", pathParams: { slug }, query: { page } });
  const own = useApiQuery<{ eligible: boolean; review: OwnReview | null }>({ path: "/api/reviews/{slug}/mine", pathParams: { slug } }, !!account.data?.user);
  return <section className="state-panel"><h2>Ratings and reviews</h2>
    {(reviews.error || own.error) && <p role="alert">{friendlyError(reviews.error ?? own.error)} <button onClick={() => { void reviews.refetch(); if (account.data?.user) void own.refetch(); }}>Retry reviews</button></p>}
    {reviews.isPending && <p role="status">Loading reviews…</p>}
    {reviews.data && <><p>{reviews.data.count} published reviews{reviews.data.average && ` · ${reviews.data.average} / 5`}</p>
      {reviews.data.results.map(review => <article key={review.id}><h3>{review.title} · {review.rating}/5</h3><p>{review.display_name} · Verified purchase</p><p className="content-copy">{review.body}</p></article>)}
      <nav aria-label="Review pages"><button disabled={!reviews.data.previous} onClick={() => setPage(value => value - 1)}>Previous</button><span> Page {page} </span><button disabled={!reviews.data.next} onClick={() => setPage(value => value + 1)}>Next</button></nav>
    </>}
    {!account.isPending && !account.data?.user && <p><Link href="/login">Sign in</Link> to review a product from your delivered order. Email verification remains optional.</p>}
    {own.data && <>{own.data.review && <p>Your review: {own.data.review.status}{own.data.review.moderation_note && ` · ${own.data.review.moderation_note}`}</p>}
      {own.data.eligible ? <ReviewForm key={own.data.review?.revision ?? "new"} slug={slug} review={own.data.review} /> : <p>Reviews are available after a purchase in this account has been delivered.</p>}
    </>}
  </section>;
}
