"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError, type User } from "@/lib/api";
import type { Page } from "@/lib/catalog-types";
import { RefundRequestForm } from "./refund-request-form";
import { RefundReview } from "./refund-review";
import type { RefundRecord } from "./types";

export function RefundWorkspace() {
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const user = account.data?.user;
  const can = (action: string) => !!user?.is_staff && (user.is_superuser || user.permissions.includes(`payments.${action}`));
  const allowed = can("view_refundrecord");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const entries = useApiQuery<Page<RefundRecord>>({ path: "/api/admin/refunds", query: { page } }, allowed);
  if (account.isPending) return <main id="main-content" className="state-panel"><p role="status">Checking access…</p></main>;
  if (!allowed) return <main id="main-content" className="state-panel"><h1>Refund access required.</h1><Link href="/admin">Administration</Link></main>;
  return <main id="main-content" className="catalog-page"><h1>Manual refunds</h1><Link href="/admin">Back to administration</Link>
    {entries.error && <p role="alert">{friendlyError(entries.error)} <button onClick={() => entries.refetch()}>Retry refunds</button></p>}
    {entries.isPending && <p role="status">Loading refunds…</p>}
    <div className="admin-layout"><section>{can("request_refund") && <RefundRequestForm />}<h2>Refund ledger</h2><ul>{entries.data?.results.map(entry => <li key={entry.id}><button className="secondary-button" onClick={() => setSelected(entry.id)}>Refund #{entry.id} · {entry.order_reference}</button> · {entry.status}</li>)}</ul>
      {entries.data && !entries.data.results.length && <p>No refunds yet.</p>}
      <nav aria-label="Refund pages"><button disabled={!entries.data?.previous} onClick={() => setPage(value => value - 1)}>Previous</button><span> Page {page} </span><button disabled={!entries.data?.next} onClick={() => setPage(value => value + 1)}>Next</button></nav>
    </section>{selected && <RefundReview key={selected} id={selected} canResolve={can("complete_refund")} />}</div>
  </main>;
}
