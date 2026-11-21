"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError, type User } from "@/lib/api";
import type { Page } from "@/lib/catalog-types";
import { ReturnReview } from "./return-review";

export function ReturnWorkspace() {
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const user = account.data?.user;
  const allowed = !!user?.is_staff && (user.is_superuser || user.permissions.includes("returns.view_returnrequest"));
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const entries = useApiQuery<Page<{ id: number; reference: string; status: string }>>({ path: "/api/admin/returns", query: { page } }, allowed);
  if (account.isPending) return <main id="main-content" className="state-panel"><p role="status">Checking access…</p></main>;
  if (!allowed) return <main id="main-content" className="state-panel"><h1>Return access required.</h1><Link href="/admin">Administration</Link></main>;
  return <main id="main-content" className="catalog-page"><h1>Returns</h1><Link href="/admin">Back to administration / return policy</Link>
    {entries.error && <p role="alert">{friendlyError(entries.error)} <button onClick={() => entries.refetch()}>Retry returns</button></p>}
    {entries.isPending && <p role="status">Loading returns…</p>}
    <div className="admin-layout"><section><ul>{entries.data?.results.map(entry => <li key={entry.id}><button className="secondary-button" onClick={() => setSelected(entry.id)}>Return #{entry.id} · {entry.reference}</button> · {entry.status}</li>)}</ul>
      {entries.data && !entries.data.results.length && <p>No returns yet.</p>}
      <nav aria-label="Return pages"><button disabled={!entries.data?.previous} onClick={() => setPage(value => value - 1)}>Previous</button><span> Page {page} </span><button disabled={!entries.data?.next} onClick={() => setPage(value => value + 1)}>Next</button></nav>
    </section>{selected && <ReturnReview key={selected} id={selected} canReview={!!user && (user.is_superuser || user.permissions.includes("returns.review_return"))} />}</div>
  </main>;
}
