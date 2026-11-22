"use client";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { ReturnForm } from "./return-form";
import type { ReturnDetails } from "./types";
import { priceLabel } from "@/lib/catalog-types";

export function ReturnPanel({ reference }: { reference: string }) {
  const query = useApiQuery<ReturnDetails>({ path: "/api/orders/{reference}/returns", pathParams: { reference } });
  const details = query.data;
  const remaining = details?.items.filter(item => item.remaining > 0) ?? [];
  return <section className="state-panel"><h2>Returns</h2>
    {query.error && <p role="alert">{friendlyError(query.error)}</p>}
    <button className="secondary-button" onClick={() => query.refetch()} disabled={query.isFetching}>Refresh return status</button>
    {query.isPending && <p role="status">Loading return policy…</p>}
    {details && <>
      {details.policy?.is_enabled ? <><h3>{details.policy.name}</h3><p>Return window: {details.policy.window_days} days after delivery.</p><p>Shipping: {details.policy.shipping_refund_policy}</p><p>Tax: {details.policy.tax_refund_policy}</p><p>{details.policy.instructions}</p></> : <p>Online returns are unavailable until the store configures and enables its return policy.</p>}
      {details.requests.map(entry => <div key={entry.id}><h3>Return #{entry.id} · {entry.status}</h3><p>{entry.reason}</p><ul>{entry.items.map(item => <li key={item.id}>{item.name} × {item.quantity}</li>)}</ul><ul>{entry.events.map(event => <li key={event.status}>{event.status} · {event.note}</li>)}</ul></div>)}
      {details.eligible && remaining.length > 0 && <ReturnForm key={JSON.stringify(remaining)} reference={reference} items={remaining} />}
      {details.requests.flatMap(entry => entry.refunds ?? []).map(refund => <p key={refund.id}>Refund #{refund.id} · {priceLabel(refund.amount)} · {refund.status}</p>)}
      {!details.eligible && details.policy?.is_enabled && <p>This order is outside the currently available return workflow. Contact the store about your order.</p>}
    </>}
  </section>;
}
