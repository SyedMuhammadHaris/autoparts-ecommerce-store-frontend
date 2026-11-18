"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, friendlyError } from "@/lib/api";
import { priceLabel } from "@/lib/catalog-types";
import { Totals } from "./totals";
import type { Order } from "./types";

export function OrderPage({ reference }: { reference: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    apiRequest<Order>(`/api/orders/${reference}`).then(value => { if (active) { setOrder(value); setError(""); } }).catch(failure => { if (active) setError(friendlyError(failure)); });
    return () => { active = false; };
  }, [reference, revision]);
  async function cancel() {
    if (busy) return;
    setBusy(true); setError("");
    try { setOrder(await apiRequest<Order>(`/api/orders/${reference}/cancel`, "POST", {})); }
    catch (failure) { setError(friendlyError(failure)); } finally { setBusy(false); }
  }
  return <main id="main-content" className="catalog-page"><p className="eyebrow">Order confirmation</p><h1>Your order.</h1>
    {error && <p role="alert" className="form-error">{error} <button onClick={() => setRevision(value => value + 1)}>Refresh order</button></p>}
    {!order && !error && <p role="status">Loading order…</p>}
    {order && <><p>Reference: <strong>{order.reference}</strong></p><p>Status: {order.status} · Payment: {order.payment.status.replaceAll("_", " ")}</p>
      {order.status === "pending" && <p>Your order is pending confirmation. Its stock reservation expires at {new Date(order.expires_at).toLocaleString("en-PK")}. Payment is not marked collected or verified.</p>}
      <div className="checkout-layout"><section><h2>Items</h2><ul>{order.items.map(item => <li key={item.sku}>{item.name} · {item.sku} × {item.quantity} · {priceLabel(item.line_total)}</li>)}</ul><Totals amounts={order} /></section>
        <section><h2>Delivery</h2><p>{order.address.name}<br />{order.address.line1}<br />{order.address.line2}<br />{order.address.city} {order.address.postal_code} · {order.address.country}</p><p>{order.shipping_method}</p><p>{order.address.email}<br />{order.address.phone}</p>
          <h2>Status history</h2><ul>{order.history.map((entry, index) => <li key={index}>{entry.status} · {new Date(entry.created_at).toLocaleString("en-PK")}</li>)}</ul>
          {order.status === "pending" && <button className="secondary-button" disabled={busy} onClick={cancel}>{busy ? "Cancelling…" : "Cancel pending order"}</button>}
        </section></div><p>Guest order access uses a private cookie in this browser. Keep your reference; the link alone does not grant access.</p><Link href="/products">Continue shopping</Link></>}
  </main>;
}
