import type { Product } from "@/lib/catalog-types";
import { absoluteUrl } from "./policy";

export function serializeStructuredData(data: object): string {
  // JSON is not HTML: escape script terminators even when entered through the CMS.
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function productStructuredData(product: Product) {
  const url = absoluteUrl(`/products/${encodeURIComponent(product.slug)}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    url,
    ...(product.display_image_url ? { image: product.display_image_url } : {}),
    ...(product.brand_name ? { brand: { "@type": "Brand", name: product.brand_name } } : {}),
    offers: product.variants.map(variant => ({
      "@type": "Offer",
      sku: variant.sku,
      price: variant.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${variant.quantity_available > 0 ? "InStock" : "OutOfStock"}`,
      url,
    })),
  };
}

export function productBreadcrumbs(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "All parts", item: absoluteUrl("/products") },
      { "@type": "ListItem", position: 3, name: product.name, item: absoluteUrl(`/products/${encodeURIComponent(product.slug)}`) },
    ],
  };
}
