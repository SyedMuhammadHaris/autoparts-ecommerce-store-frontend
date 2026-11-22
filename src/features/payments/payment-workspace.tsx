"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError, type User } from "@/lib/api";
import type { Page } from "@/lib/catalog-types";
import { PaymentReview } from "./payment-review";
import type { PaymentRow } from "./types";

export function PaymentWorkspace() {
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const user = account.data?.user;
  const allowed = !!user?.is_staff && (user.is_superuser || user.permissions.includes("payments.view_payment"));
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const orders = useApiQuery<Page<PaymentRow>>({ path: "/api/admin/payments", query: { page } }, allowed);
  if (account.isPending) return <main id="main-content" className="state-panel"><p role="status">Checking access…</p></main>;
  if (!allowed) return <main id="main-content" className="state-panel"><h1>Payment access required.</h1><p>Sign in with an authorized staff account.</p><Link href="/admin">Administration</Link></main>;
  return <main id="main-content" className="catalog-page"><h1>Payments</h1><Link href="/admin">Back to administration / bank accounts</Link>
    {orders.error && <p role="alert">{friendlyError(orders.error)} <button onClick={() => orders.refetch()}>Retry payment list</button></p>}
    {orders.isPending && <p role="status">Loading payments…</p>}
    <div className="admin-layout"><section><ul>{orders.data?.results.map(order => <li key={order.id}><button className="secondary-button" onClick={() => setSelected(order.id)}>{order.reference}</button> · {order.method} · {order.payment_status.replaceAll("_", " ")}</li>)}</ul>
      {orders.data && !orders.data.results.length && <p>No orders yet.</p>}
      <nav aria-label="Payment pages"><button disabled={!orders.data?.previous} onClick={() => setPage(value => value - 1)}>Previous</button><span> Page {page} </span><button disabled={!orders.data?.next} onClick={() => setPage(value => value + 1)}>Next</button></nav>
    </section>{selected && <PaymentReview key={selected} id={selected} user={user!} />}</div>
  </main>;
}
