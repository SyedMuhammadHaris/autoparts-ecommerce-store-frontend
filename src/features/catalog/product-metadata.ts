import type { Metadata } from "next";
import { readProduct } from "@/lib/server/catalog";
import type { ProductRouteProps } from "./route-types";
import { publicRobots } from "@/lib/seo/policy";

export async function productMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  try {
    const product = await readProduct((await params).slug);
    const description = product.description.slice(0, 160) || `Explore ${product.name}, product options and vehicle compatibility in Pakistan.`;
    return {
      title: product.name, description, robots: publicRobots(),
      alternates: { canonical: `/products/${product.slug}` },
      openGraph: { type: "website", title: product.name, description, url: `/products/${product.slug}`, ...(product.display_image_url ? { images: [{ url: product.display_image_url, alt: product.name }] } : {}) },
    };
  }
  catch { return { title: "Product unavailable", robots: { index: false } }; }
}
