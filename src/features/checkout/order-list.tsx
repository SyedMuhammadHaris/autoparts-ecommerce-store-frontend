"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { priceLabel, type Page } from "@/lib/catalog-types";
type Summary = { reference: string; status: string; total: string; created_at: string };
export function OrderList() {
  const [page, setPage] = useState(1);
  const query = useApiQuery<Page<Summary>>({ path: "/api/orders", query: { page } });
  const orders = query.data;
  return <main id="main-content" className="catalog-page"><h1>Your orders.</h1>
    {query.error && <p role="alert">{friendlyError(query.error)} <button onClick={() => query.refetch()}>Retry</button></p>}
    {query.isPending && !query.error && <p role="status">Loading orders…</p>}
    {orders && <><ul>{orders.results.map(order => <li key={order.reference}><Link href={`/orders/${order.reference}`}>{order.reference}</Link> · {order.status} · {priceLabel(order.total)}</li>)}</ul>
      {!orders.count && <p>No account orders yet. Guest orders remain accessible using their confirmation link and the original browser cookie.</p>}
      <nav className="pagination" aria-label="Order pages"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page}</span><button disabled={!orders.next} onClick={() => setPage(value => value + 1)}>Next</button></nav></>}
  </main>;
}
