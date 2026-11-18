"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, friendlyError } from "@/lib/api";
import { priceLabel, type Page } from "@/lib/catalog-types";
type Summary = { reference: string; status: string; total: string; created_at: string };
export function OrderList() {
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Page<Summary> | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    apiRequest<Page<Summary>>(`/api/orders?page=${page}`).then(value => { if (active) { setOrders(value); setError(""); } }).catch(failure => { if (active) setError(friendlyError(failure)); });
    return () => { active = false; };
  }, [page, revision]);
  return <main id="main-content" className="catalog-page"><h1>Your orders.</h1>
    {error && <p role="alert">{error} <button onClick={() => setRevision(value => value + 1)}>Retry</button></p>}
    {!orders && !error && <p role="status">Loading orders…</p>}
    {orders && <><ul>{orders.results.map(order => <li key={order.reference}><Link href={`/orders/${order.reference}`}>{order.reference}</Link> · {order.status} · {priceLabel(order.total)}</li>)}</ul>
      {!orders.count && <p>No account orders yet. Guest orders remain accessible using their confirmation link and the original browser cookie.</p>}
      <nav className="pagination" aria-label="Order pages"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page}</span><button disabled={!orders.next} onClick={() => setPage(value => value + 1)}>Next</button></nav></>}
  </main>;
}
