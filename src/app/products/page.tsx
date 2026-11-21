import type { Metadata } from "next";
import { CatalogScreen } from "@/features/catalog/catalog-screen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop automotive parts", description: "Explore automotive parts and product options in Pakistan." };

export default function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen {...props} />;
}
