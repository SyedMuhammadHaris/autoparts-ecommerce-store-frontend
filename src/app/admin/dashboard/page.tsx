import type { Metadata } from "next";
import { ReportWorkspace } from "@/features/reports/report-workspace";

export const metadata: Metadata = { title: "Store dashboard", robots: { index: false, follow: false } };
export default function Page() { return <ReportWorkspace />; }
