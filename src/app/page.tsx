import { HomeContent } from "@/features/content/home-content";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export const dynamic = "force-dynamic";

export default function Page() {
  return <HomeContent />;
}
