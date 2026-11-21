import type { Metadata } from "next";
import { ReturnWorkspace } from "@/features/returns/return-workspace";

export const metadata: Metadata = { title: "Return management", robots: { index: false, follow: false } };
export default function Page() { return <ReturnWorkspace />; }
