import type { Metadata } from "next";
import { FulfillmentWorkspace } from "@/features/fulfillment/fulfillment-workspace";

export const metadata: Metadata = { title: "Order fulfillment", robots: { index: false, follow: false } };
export default function Page() { return <FulfillmentWorkspace />; }
