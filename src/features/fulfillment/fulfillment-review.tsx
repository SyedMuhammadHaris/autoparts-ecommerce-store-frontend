"use client";
import Link from "next/link";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import type { Order } from "@/features/checkout/types";
import { FulfillmentForm } from "./fulfillment-form";

const next: Record<string, string> = { confirmed: "processing", processing: "shipped", shipped: "delivered", delivered: "completed" };

export function FulfillmentReview({ id, canFulfill }: { id: number; canFulfill: boolean }) {
  const query = useApiQuery<Order>({ path: "/api/admin/fulfillment/{id}", pathParams: { id } });
  const order = query.data;
  const target = order && next[order.status];
  const paymentReady = order && (order.payment.status === "verified" || order.payment.status === "collected");
  return <section className="admin-editor"><h2>Order fulfillment</h2>
    {query.error && <p role="alert">{friendlyError(query.error)} <button onClick={() => query.refetch()}>Refresh order</button></p>}
    {query.isPending && <p role="status">Loading order…</p>}
    {order && <><p>{order.reference} · {order.status}</p><p>{order.address.name} · {order.address.line1} · {order.address.city}</p><p>{order.address.phone}</p><ul>{order.items.map(item => <li key={item.sku}>{item.sku} × {item.quantity}</li>)}</ul>
      {order.shipment && <p>{order.shipment.carrier} · {order.shipment.tracking_reference}</p>}
      {order.status === "pending" && <p>Payment staff must confirm this order before processing.</p>}
      {target === "completed" && !paymentReady ? <p>Payment must be verified or collected before completion. <Link href="/admin/payments">Payment management</Link></p> : target && canFulfill && <FulfillmentForm key={target} id={id} target={target} />}
      <ul>{order.history.map((entry, index) => <li key={index}>{entry.status} · {new Date(entry.created_at).toLocaleString("en-PK")}</li>)}</ul>
    </>}
  </section>;
}
