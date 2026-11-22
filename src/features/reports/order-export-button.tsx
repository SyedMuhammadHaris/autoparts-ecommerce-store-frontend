"use client";
import { useMutation } from "@tanstack/react-query";
import { clientFetch, friendlyError } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notifications";
import type { ReportFilters } from "./types";

export function OrderExportButton({ filters }: { filters: ReportFilters }) {
  const exportOrders = useMutation({ retry: false, gcTime: 0,
    mutationFn: () => clientFetch<{ filename: string; content: string; count: number }>({ path: "/api/admin/reports/orders-export", query: filters }),
    onSuccess: result => {
      const url = URL.createObjectURL(new Blob([result.content], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url; link.download = result.filename; document.body.appendChild(link);
      link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      notifySuccess(`Export prepared: ${result.count} orders.`);
    }, onError: error => notifyError(error),
  });
  return <div><button className="secondary-button" disabled={exportOrders.isPending} onClick={() => exportOrders.mutate()}>{exportOrders.isPending ? "Preparing CSV…" : "Export orders CSV"}</button>
    <p>Up to 1000 orders per export. Customer names, emails, addresses and payment receipts are excluded.</p>
    {exportOrders.error && <p role="alert">{friendlyError(exportOrders.error)}</p>}
  </div>;
}
