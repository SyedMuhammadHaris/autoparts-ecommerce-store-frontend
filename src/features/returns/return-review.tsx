"use client";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { ReturnReviewForm } from "./return-review-form";
import { InspectionForm } from "./inspection-form";
import type { ReturnEntry } from "./types";

export function ReturnReview({ id, canReview }: { id: number; canReview: boolean }) {
  const query = useApiQuery<ReturnEntry>({ path: "/api/admin/returns/{id}", pathParams: { id } });
  const entry = query.data;
  return <section className="admin-editor"><h2>Return review</h2>
    {query.error && <p role="alert">{friendlyError(query.error)} <button onClick={() => query.refetch()}>Retry return</button></p>}
    {query.isPending && <p role="status">Loading return…</p>}
    {entry && <><p>Return #{entry.id} · Order {entry.order_reference} · {entry.status}</p><p>{entry.reason}</p><ul>{entry.items.map(item => <li key={item.id}>{item.sku} × {item.quantity} · Restocked: {item.restock_quantity ?? "Not inspected"}</li>)}</ul>
      <h3>Policy at request time</h3><p>{entry.policy.shipping_refund_policy}</p><p>{entry.policy.tax_refund_policy}</p>
      {canReview && entry.status === "requested" && <ReturnReviewForm id={id} />}
      {canReview && entry.status === "approved" && <InspectionForm entry={entry} />}
      {entry.events.map(event => <p key={event.status}>{event.status} · {event.note}</p>)}
      <p>Return decisions and inspection do not record a monetary refund.</p>
    </>}
  </section>;
}
