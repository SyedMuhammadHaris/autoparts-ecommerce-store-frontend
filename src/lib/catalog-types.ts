export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };
export type Taxonomy = { id: number; name: string; slug: string; is_active: boolean; parent?: number | null };
export type Variant = { id: number; sku: string; price: string; quantity_available: number; values: { id: number; attribute_name: string; value: string }[] };
export type Product = {
  id: number; name: string; slug: string; sku: string; description: string;
  category_name: string; brand_name: string | null; base_price: string; price: string;
  currency: "PKR"; display_image_url: string; variants: Variant[];
  images: { id: number; url: string; alt_text: string; is_primary: boolean }[];
};
export function priceLabel(value: string): string {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 2 }).format(Number(value));
}
