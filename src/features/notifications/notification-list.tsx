"use client";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import type { Page } from "@/lib/catalog-types";
import type { OrderNotice } from "./types";

export function NotificationList({ reference }: { reference?: string }) {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const path = reference ? "/api/orders/{reference}/notifications" : "/api/notifications";
  const pathParams = reference ? { reference } : undefined;
  const notices = useApiQuery<Page<OrderNotice>>({ path, pathParams, query: { page } });
  const read = useApiMutation<unknown, number>(id => ({ path, pathParams, method: "POST", payload: { id } }), [reference ? `/api/orders/${reference}` : "/api/notifications"]);
  function refresh() {
    void notices.refetch();
    if (reference) void client.invalidateQueries({ predicate: query => query.queryKey[0] === "api" && query.queryKey[1] === `/api/orders/${reference}` });
  }
  return <section className="state-panel"><h2>Order updates</h2><p>Updates are processed in the background. Refresh to check for new messages.</p>
    <button className="secondary-button" onClick={refresh} disabled={notices.isFetching}>Refresh updates</button>
    {(notices.error || read.error) && <p role="alert">{friendlyError(notices.error ?? read.error)}</p>}
    {notices.isPending && <p role="status">Loading updates…</p>}
    {notices.data && !notices.data.results.length && <p>No updates yet.</p>}
    {notices.data?.results.map(notice => <article key={notice.id}><h3>{notice.subject}</h3><p className="content-copy">{notice.body}</p><p>{new Date(notice.created_at).toLocaleString("en-PK")} · {notice.read_at ? "Read" : "Unread"}</p>
      {!reference && <Link href={`/orders/${notice.order_reference}`}>View order</Link>}
      {!notice.read_at && <button className="secondary-button" disabled={read.isPending} onClick={() => read.mutate(notice.id)}>Mark as read</button>}
    </article>)}
    <nav aria-label="Notification pages"><button disabled={!notices.data?.previous} onClick={() => setPage(value => value - 1)}>Previous</button><span> Page {page} </span><button disabled={!notices.data?.next} onClick={() => setPage(value => value + 1)}>Next</button></nav>
  </section>;
}
