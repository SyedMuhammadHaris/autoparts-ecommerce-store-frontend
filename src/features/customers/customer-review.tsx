"use client";
import { useState } from "react";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import type { Page } from "@/lib/catalog-types";
import { priceLabel } from "@/lib/catalog-types";
import { AccountStatusForm } from "@/features/admin/account-status-form";

export type Customer = { id: number; name: string; email: string; email_verified: boolean; is_active: boolean; orders_count: number };
type CustomerOrder = { reference: string; status: string; total: string; payment_status: string };

export function CustomerReview({ id, canManage }: { id: number; canManage: boolean }) {
  const [page, setPage] = useState(1);
  const account = useApiQuery<Customer>({ path: "/api/admin/customers/{id}", pathParams: { id } });
  const orders = useApiQuery<Page<CustomerOrder>>({ path: "/api/admin/customers/{id}/orders", pathParams: { id }, query: { page } });
  return <section className="admin-editor"><h2>Customer account</h2>
    {(account.error || orders.error) && <p role="alert">{friendlyError(account.error ?? orders.error)} <button onClick={() => { void account.refetch(); void orders.refetch(); }}>Retry customer</button></p>}
    {account.isPending && <p role="status">Loading customer…</p>}
    {account.data && <><p>{account.data.name} · {account.data.email}</p><p>{account.data.email_verified ? "Email verified" : "Email verification optional"} · {account.data.is_active ? "Active" : "Disabled"}</p>
      {canManage && <AccountStatusForm key={`${id}-${account.data.is_active}`} id={id} active={account.data.is_active} kind="customers" />}
    </>}
    <h3>Registered account orders</h3><p>Guest orders are not automatically claimed by email.</p>
    <ul>{orders.data?.results.map(order => <li key={order.reference}>{order.reference} · {order.status} · {priceLabel(order.total)} · {order.payment_status}</li>)}</ul>
    <nav aria-label="Customer order pages"><button disabled={!orders.data?.previous} onClick={() => setPage(value => value - 1)}>Previous</button><span> Page {page} </span><button disabled={!orders.data?.next} onClick={() => setPage(value => value + 1)}>Next</button></nav>
  </section>;
}
