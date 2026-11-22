"use client";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { priceLabel } from "@/lib/catalog-types";
import { RefundResolutionForm } from "./refund-resolution-form";
import type { RefundRecord } from "./types";

export function RefundReview({ id, canResolve }: { id: number; canResolve: boolean }) {
  const query = useApiQuery<RefundRecord>({ path: "/api/admin/refunds/{id}", pathParams: { id } });
  const entry = query.data;
  return <section className="admin-editor"><h2>Refund record</h2>
    {query.error && <p role="alert">{friendlyError(query.error)} <button onClick={() => query.refetch()}>Refresh refund</button></p>}
    {query.isPending && <p role="status">Loading refund…</p>}
    {entry && <><p>Refund #{entry.id} · Order {entry.order_reference} · Return #{entry.return_request}</p><p>{priceLabel(entry.amount)} · {entry.status}</p><p>{entry.reason}</p>
      <p>Amount paid: {priceLabel(entry.paid_amount)} · Pending/completed authorizations: {priceLabel(entry.allocated_refunds)}</p>
      {entry.reference && <p>Offline receipt: {entry.reference}</p>}{entry.resolution_note && <p>{entry.resolution_note}</p>}
      {canResolve && entry.status === "pending" && <RefundResolutionForm id={id} />}
    </>}
  </section>;
}
