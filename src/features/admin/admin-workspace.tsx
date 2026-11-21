"use client";
import Link from "next/link";
import { useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { clientFetch, friendlyError, type User } from "@/lib/api";
import { useApiQuery } from "@/lib/query/hooks";
import type { Page } from "@/lib/catalog-types";
import { resources, permission, label, type Row } from "@/features/admin/resources";
import { RecordForm } from "@/features/admin/record-form";
import { StockForm } from "@/features/admin/stock-form";
import { RolesForm } from "@/features/admin/roles-form";

async function allRows(resource: string, signal: AbortSignal): Promise<Row[]> {
  const rows: Row[] = [];
  for (let page = 1; page <= 100; page++) {
    const result = await clientFetch<Page<Row>>({ path: "/api/admin/{resource}", pathParams: { resource }, query: { page_size: 100, page }, signal });
    rows.push(...result.results);
    if (!result.next) return rows;
  }
  throw new Error("Too many records for this initial management view.");
}
export function AdminWorkspace() {
  const client = useQueryClient();
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const user = account.data?.user;
  const [resourceKey, setResourceKey] = useState("products");
  const [selected, setSelected] = useState<Row | null>(null);
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const visible = user?.is_staff ? resources.filter(item => item.key === "staff" ? user.is_superuser : permission(user, item.model, "view")) : [];
  const resource = visible.find(item => item.key === resourceKey) ?? visible[0] ?? resources.find(item => item.key === "products")!;
  const sources = [...new Set(resource.fields.flatMap(field => field.source ? [field.source] : []))];
  if (resource.key === "staff") sources.push("roles");
  const queries = useQueries({ queries: [resource.key, ...sources].map(key => ({
    queryKey: ["admin-rows", key], queryFn: ({ signal }: { signal: AbortSignal }) => allRows(key, signal), enabled: visible.includes(resource),
  })) });
  const rows = queries[0]?.data ?? [];
  const choices = Object.fromEntries(sources.map((source, index) => [source, queries[index + 1]?.data ?? []]));
  const error = queries.find(query => query.error)?.error;
  const loading = queries.some(query => query.isPending);
  const canWrite = !!user && permission(user, resource.model, selected ? "change" : "add");
  function chooseResource(key: string) { setResourceKey(key); setSelected(null); setNotice(""); }
  async function saved() {
    setNotice("Changes saved."); setSelected(null); setRevision(value => value + 1);
    await Promise.all([client.invalidateQueries({ queryKey: ["admin-rows"] }), client.invalidateQueries({ queryKey: ["api"] })]);
  }
  if (account.isPending) return <main id="main-content" className="state-panel"><p role="status">Checking access…</p></main>;
  if (!user?.is_staff) return <main id="main-content" className="state-panel"><h1>Staff access required.</h1><p>Sign in with an authorized staff account.</p><Link href="/login">Sign in</Link></main>;
  return <main id="main-content" className="catalog-page"><p className="eyebrow">Store workspace</p><h1>Catalog management.</h1>
    <p>Manage parts, inventory and checkout configuration. Shipping rates and tax policy must be explicitly configured before ordering.</p>
    {(user.is_superuser || user.permissions.includes("payments.view_payment")) && <p><Link href="/admin/payments">Manage payments</Link></p>}
    {(user.is_superuser || user.permissions.includes("orders.view_order")) && <p><Link href="/admin/fulfillment">Manage fulfillment</Link></p>}
    {(user.is_superuser || user.permissions.includes("returns.view_returnrequest")) && <p><Link href="/admin/returns">Manage returns</Link></p>}
    <nav className="admin-tabs" aria-label="Management sections">{visible.map(item => <button className="secondary-button" aria-current={resource.key === item.key ? "page" : undefined} key={item.key} onClick={() => chooseResource(item.key)}>{item.label}</button>)}</nav>
    {error && <p role="alert" className="form-error">{friendlyError(error)} <button onClick={() => queries.forEach(query => { void query.refetch(); })}>Retry loading</button></p>}
    {notice && <p role="status">{notice}</p>}
    {!visible.length ? <p>No management permissions have been assigned.</p> : <div className="admin-layout">
      <section><h2>{resource.label}</h2>{!resource.readonly && canWrite && <button className="secondary-button" onClick={() => { setSelected(null); setRevision(value => value + 1); }}>New record</button>}
        {loading ? <p role="status">Loading records…</p> : rows.length === 0 ? <p>No records yet.</p> : <div className="table-scroll"><table><thead><tr><th scope="col">Record</th><th scope="col">Details</th><th scope="col">Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{label(row)}</td><td>{resource.key === "inventory" ? `${row.quantity_on_hand} on hand / ${row.quantity_reserved} reserved / ${row.quantity_available} available` : resource.key === "audit" ? `${row.object_type} #${row.object_id} · ${row.created_at}` : row.is_active === false ? "Inactive / draft" : row.sku ? String(row.sku) : `#${row.id}`}</td><td>{resource.key !== "audit" && <button className="secondary-button" onClick={() => { setSelected(row); setNotice(""); }}>{resource.key === "inventory" ? "Adjust" : resource.key === "staff" ? "Roles" : "View / edit"}</button>}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="admin-editor" key={`${resource.key}-${selected?.id ?? "new"}-${revision}`}><h2>{selected ? label(selected) : "New record"}</h2>
        {loading ? <p role="status">Loading editor choices…</p> : error ? <p>Resolve the loading error before editing records.</p> : !resource.readonly ? <RecordForm resource={resource} selected={selected} choices={choices} canWrite={canWrite} loading={loading} onSaved={saved} /> : resource.key === "inventory" && selected ? permission(user, resource.model, "change") ? <StockForm id={selected.id} onSaved={saved} /> : <p>You have read access to inventory.</p> : resource.key === "staff" && selected ? <RolesForm selected={selected} roles={choices.roles ?? []} onSaved={saved} /> : <p>{resource.key === "audit" ? "Audit history is read only." : "Choose a record to manage."}</p>}
      </section>
    </div>}
  </main>;
}
