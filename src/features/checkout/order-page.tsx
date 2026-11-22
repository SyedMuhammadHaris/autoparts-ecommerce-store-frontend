"use client";
import Link from "next/link";
import { useApiQuery, useApiMutation } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { priceLabel } from "@/lib/catalog-types";
import { Totals } from "./totals";
import type { Order } from "./types";
import { PaymentPanel } from "@/features/payments/payment-panel";
import { ReturnPanel } from "@/features/returns/return-panel";

export function OrderPage({ reference }: { reference: string }) {
  const query = useApiQuery<Order>({ path: "/api/orders/{reference}", pathParams: { reference } });
  const order = query.data;
  const cancel = useApiMutation<Order, void>(() => ({ path: "/api/orders/{reference}/cancel", pathParams: { reference }, method: "POST", payload: {}, notifications: { success: "Order cancelled." } }), ["/api/orders"]);
  const error = query.error ?? cancel.error;
  return <main id="main-content" className="catalog-page"><p className="eyebrow">Order confirmation</p><h1>Your order.</h1>
    {error && <p role="alert" className="form-error">{friendlyError(error)} <button onClick={() => query.refetch()}>Refresh order</button></p>}
    {query.isPending && !error && <p role="status">Loading order…</p>}
    {order && <><p>Reference: <strong>{order.reference}</strong></p><p>Status: {order.status} · Payment: {order.payment.status.replaceAll("_", " ")}</p>
      {order.payment.method === "bank_transfer" && <PaymentPanel reference={reference} status={order.status} />}
      {["delivered", "completed"].includes(order.status) && <ReturnPanel reference={reference} />}
      {order.shipment && <section className="state-panel"><h2>Shipment tracking</h2><p>{order.shipment.carrier} · {order.shipment.tracking_reference}</p><ul>{order.shipment.events.map(entry => <li key={entry.status}>{entry.status} · {new Date(entry.created_at).toLocaleString("en-PK")}</li>)}</ul></section>}
      {order.status === "pending" && <p>Your order is pending confirmation. Its stock reservation expires at {new Date(order.expires_at).toLocaleString("en-PK")}. Payment is not marked collected or verified.</p>}
      <div className="checkout-layout"><section><h2>Items</h2><ul>{order.items.map(item => <li key={item.sku}>{item.name} · {item.sku} × {item.quantity} · {priceLabel(item.line_total)}</li>)}</ul><Totals amounts={order} /></section>
        <section><h2>Delivery</h2><p>{order.address.name}<br />{order.address.line1}<br />{order.address.line2}<br />{order.address.city} {order.address.postal_code} · {order.address.country}</p><p>{order.shipping_method}</p><p>{order.address.email}<br />{order.address.phone}</p>
          <h2>Status history</h2><ul>{order.history.map((entry, index) => <li key={index}>{entry.status} · {new Date(entry.created_at).toLocaleString("en-PK")}</li>)}</ul>
          {order.status === "pending" && <button className="secondary-button" disabled={cancel.isPending} onClick={() => cancel.mutate()}>{cancel.isPending ? "Cancelling…" : "Cancel pending order"}</button>}
        </section></div><p>Guest order access uses a private cookie in this browser. Keep your reference; the link alone does not grant access.</p><Link href="/products">Continue shopping</Link></>}
  </main>;
}
