import type { Metadata } from "next";
import { RefundWorkspace } from "@/features/refunds/refund-workspace";

export const metadata: Metadata = { title: "Manual refunds", robots: { index: false, follow: false } };
export default function Page() { return <RefundWorkspace />; }
