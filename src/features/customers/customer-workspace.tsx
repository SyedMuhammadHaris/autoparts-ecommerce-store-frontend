"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError, type User } from "@/lib/api";
import type { Page } from "@/lib/catalog-types";
import { ManagementFilterForm } from "@/features/admin/management-filter-form";
import { CustomerReview, type Customer } from "./customer-review";

export function CustomerWorkspace() {
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const user = account.data?.user;
  const allowed = !!user?.is_staff && (user.is_superuser || user.permissions.includes("accounts.view_customers"));
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const customers = useApiQuery<Page<Customer>>({ path: "/api/admin/customers", query: { ...filters, page } }, allowed);
  if (account.isPending) return <main id="main-content" className="state-panel"><p role="status">Checking access…</p></main>;
  if (!allowed) return <main id="main-content" className="state-panel"><h1>Customer access required.</h1><Link href="/admin">Administration</Link></main>;
  return <main id="main-content" className="catalog-page"><h1>Customers</h1><Link href="/admin">Back to administration</Link>
    <ManagementFilterForm onApply={values => { setFilters(values); setPage(1); setSelected(null); }} />
    {customers.error && <p role="alert">{friendlyError(customers.error)} <button onClick={() => customers.refetch()}>Retry customer list</button></p>}
    {customers.isPending && <p role="status">Loading customers…</p>}
    <div className="admin-layout"><section><ul>{customers.data?.results.map(customer => <li key={customer.id}><button className="secondary-button" onClick={() => setSelected(customer.id)}>{customer.name || customer.email}</button> · {customer.orders_count} orders</li>)}</ul>
      {customers.data && !customers.data.results.length && <p>No matching customers.</p>}
      <nav aria-label="Customer pages"><button disabled={!customers.data?.previous} onClick={() => setPage(value => value - 1)}>Previous</button><span> Page {page} </span><button disabled={!customers.data?.next} onClick={() => setPage(value => value + 1)}>Next</button></nav>
    </section>{selected && <CustomerReview key={selected} id={selected} canManage={!!user && (user.is_superuser || user.permissions.includes("accounts.manage_customers"))} />}</div>
  </main>;
}
