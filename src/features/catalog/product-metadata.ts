import type { Metadata } from "next";
import { readProduct } from "@/lib/server/catalog";
import type { ProductRouteProps } from "./route-types";

export async function productMetadata({ params, searchParams }: ProductRouteProps): Promise<Metadata> {
  try { const product = await readProduct((await params).slug, await searchParams); return { title: product.name, description: product.description.slice(0, 160), alternates: { canonical: `/products/${product.slug}` } }; }
  catch { return { title: "Product unavailable", robots: { index: false } }; }
}
