import type { Metadata } from "next";
import { CustomerWorkspace } from "@/features/customers/customer-workspace";

export const metadata: Metadata = { title: "Customers", robots: { index: false, follow: false } };
export default function Page() { return <CustomerWorkspace />; }
