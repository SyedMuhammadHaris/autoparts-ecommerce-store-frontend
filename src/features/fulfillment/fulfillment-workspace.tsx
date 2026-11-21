"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError, type User } from "@/lib/api";
import type { Page } from "@/lib/catalog-types";
import { FulfillmentReview } from "./fulfillment-review";

export function FulfillmentWorkspace() {
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const user = account.data?.user;
  const allowed = !!user?.is_staff && (user.is_superuser || user.permissions.includes("orders.view_order"));
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const orders = useApiQuery<Page<{ id: number; reference: string; status: string }>>({ path: "/api/admin/fulfillment", query: { page } }, allowed);
  if (account.isPending) return <main id="main-content" className="state-panel"><p role="status">Checking access…</p></main>;
  if (!allowed) return <main id="main-content" className="state-panel"><h1>Order access required.</h1><Link href="/admin">Administration</Link></main>;
  return <main id="main-content" className="catalog-page"><h1>Fulfillment</h1><Link href="/admin">Back to administration</Link>
    {orders.error && <p role="alert">{friendlyError(orders.error)} <button onClick={() => orders.refetch()}>Retry orders</button></p>}
    {orders.isPending && <p role="status">Loading orders…</p>}
    <div className="admin-layout"><section><ul>{orders.data?.results.map(order => <li key={order.id}><button className="secondary-button" onClick={() => setSelected(order.id)}>{order.reference}</button> · {order.status}</li>)}</ul>
      {orders.data && !orders.data.results.length && <p>No orders yet.</p>}
      <nav aria-label="Fulfillment pages"><button disabled={!orders.data?.previous} onClick={() => setPage(value => value - 1)}>Previous</button><span> Page {page} </span><button disabled={!orders.data?.next} onClick={() => setPage(value => value + 1)}>Next</button></nav>
    </section>{selected && <FulfillmentReview key={selected} id={selected} canFulfill={!!user && (user.is_superuser || user.permissions.includes("orders.fulfill_order"))} />}</div>
  </main>;
}
