"use client";
import { useApiMutation, useApiQuery } from "@/lib/query/hooks";
import { friendlyError, type User } from "@/lib/api";
import { priceLabel } from "@/lib/catalog-types";
import { VerificationForm } from "./verification-form";
import { CollectionForm } from "./collection-form";
import type { StaffPayment } from "./types";

export function PaymentReview({ id, user }: { id: number; user: User }) {
  const query = useApiQuery<StaffPayment>({ path: "/api/admin/payments/{id}", pathParams: { id } });
  const confirm = useApiMutation<unknown, void>(() => ({ path: "/api/admin/payments/{id}/confirm-cod", pathParams: { id }, method: "POST", payload: {} }), ["/api/admin/payments"]);
  const can = (action: string) => user.is_superuser || user.permissions.includes(`payments.${action}`);
  const data = query.data;
  return <section className="admin-editor"><h2>Payment review</h2>
    {(query.error || confirm.error) && <p role="alert">{friendlyError(query.error ?? confirm.error)} <button onClick={() => query.refetch()}>Refresh payment</button></p>}
    {query.isPending && <p role="status">Loading payment…</p>}
    {data && <><p>Order {data.order.reference} · {data.order.status}</p><p>{priceLabel(data.payment.amount)} · {data.payment.status.replaceAll("_", " ")}</p>
      {data.payment.submissions.map(entry => <div key={entry.id}><p>{entry.reference} · {entry.bank.bank_name} · {entry.decision ?? "Awaiting review"}</p>{entry.note && <p>{entry.note}</p>}
        {!entry.decision && data.order.status === "pending" && can("verify_payment") && <VerificationForm orderId={id} submission={entry} />}
      </div>)}
      {data.payment.method === "cod" && data.order.status === "pending" && can("confirm_cod") && <button className="primary-button" disabled={confirm.isPending} onClick={() => confirm.mutate()}>Confirm COD order (no collection)</button>}
      {data.payment.method === "cod" && data.payment.status === "pending_collection" && ["delivered", "completed"].includes(data.order.status) && can("collect_payment") && <CollectionForm orderId={id} />}
      {data.payment.method === "cod" && !["delivered", "completed"].includes(data.order.status) && <p>COD collection becomes available after delivery is recorded.</p>}
    </>}
  </section>;
}
