"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError, type User } from "@/lib/api";
import { ReportFilterForm } from "./report-filter-form";
import { OrderExportButton } from "./order-export-button";
import { ReportSummary } from "./report-summary";
import type { DashboardReport, ReportFilters } from "./types";

function initialFilters(): ReportFilters {
  const end = new Date().toISOString().slice(0, 10);
  return { start: end.slice(0, 8) + "01", end, low_stock: "5" };
}

export function ReportWorkspace() {
  const account = useApiQuery<{ user: User }>({ path: "/api/account/me" });
  const user = account.data?.user;
  const allowed = !!user?.is_staff && (user.is_superuser || user.permissions.includes("orders.view_reports"));
  const [filters, setFilters] = useState(initialFilters);
  const report = useApiQuery<DashboardReport>({ path: "/api/admin/reports/dashboard", query: filters }, allowed);
  if (account.isPending) return <main id="main-content" className="state-panel"><p role="status">Checking access…</p></main>;
  if (!allowed) return <main id="main-content" className="state-panel"><h1>Report access required.</h1><Link href="/admin">Administration</Link></main>;
  return <main id="main-content" className="catalog-page"><h1>Store dashboard</h1><Link href="/admin">Back to administration</Link>
    <ReportFilterForm initial={filters} onApply={setFilters} />
    {report.error && <p role="alert">{friendlyError(report.error)} <button onClick={() => report.refetch()}>Retry report</button></p>}
    {report.isPending && <p role="status">Loading report…</p>}
    {report.data && <ReportSummary report={report.data} />}
    {(user?.is_superuser || user?.permissions.includes("orders.export_reports")) && <OrderExportButton filters={filters} />}
  </main>;
}
