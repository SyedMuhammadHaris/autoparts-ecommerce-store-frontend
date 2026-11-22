import type { User } from "@/lib/api";
export type Row = { id: number; [key: string]: unknown };
export type Field = { key: string; label: string; type?: string; source?: string; optional?: boolean; immutable?: boolean; maxLength?: number; defaultValue?: boolean; choices?: { value: string; label: string }[] };
export type Resource = { key: string; label: string; model: string; fields: Field[]; readonly?: boolean };
const active = { key: "is_active", label: "Active", type: "checkbox" };
export const resources: Resource[] = [
  { key: "pages", label: "Content pages", model: "content.page", fields: [{ key: "title", label: "Title", maxLength: 200 }, { key: "slug", label: "URL slug", maxLength: 120 }, { key: "body", label: "Page text (plain text)", type: "textarea", maxLength: 20000 }, { key: "description", label: "SEO description", optional: true, maxLength: 160 }, { key: "is_published", label: "Publish page", type: "checkbox", defaultValue: false }] },
  { key: "banners", label: "Homepage banners", model: "content.banner", fields: [{ key: "title", label: "Title", maxLength: 200 }, { key: "body", label: "Banner text", type: "textarea", maxLength: 1000, optional: true }, { key: "image_url", label: "Image URL", type: "url", optional: true }, { key: "link_path", label: "Local link path", maxLength: 250, optional: true }, { key: "link_label", label: "Link label", maxLength: 80, optional: true }, { key: "sort_order", label: "Display order", type: "number" }, { ...active, defaultValue: false }] },
  { key: "homepage-sections", label: "Homepage sections", model: "content.homepagesection", fields: [{ key: "title", label: "Title", maxLength: 200 }, { key: "body", label: "Section text (plain text)", type: "textarea", maxLength: 5000 }, { key: "sort_order", label: "Display order", type: "number" }, { ...active, defaultValue: false }] },
  { key: "store-settings", label: "Store contact settings", model: "content.storesettings", fields: [{ key: "name", label: "Store display name", maxLength: 120 }, { key: "tagline", label: "Footer tagline", optional: true }, { key: "support_email", label: "Public support email", type: "email", optional: true }, { key: "support_phone", label: "Public support phone", maxLength: 30, optional: true }, { key: "business_address", label: "Public business address", type: "textarea", maxLength: 500, optional: true }] },
  { key: "return-policies", label: "Return policy", model: "returns.returnpolicy", fields: [{ key: "name", label: "Policy name" }, { key: "is_enabled", label: "Enable returns", type: "checkbox" }, { key: "window_days", label: "Return window after delivery (days; 1–3650)", type: "number", optional: true }, { key: "shipping_refund_policy", label: "Shipping refund rules", optional: true }, { key: "tax_refund_policy", label: "Tax refund rules", optional: true }, { key: "instructions", label: "Return instructions", optional: true }] },
  { key: "bank-accounts", label: "Bank accounts", model: "payments.bankaccount", fields: [{ key: "name", label: "Name" }, { key: "bank_name", label: "Bank name" }, { key: "account_title", label: "Account title" }, { key: "account_number", label: "Account number" }, { key: "iban", label: "IBAN", optional: true }, { key: "instructions", label: "Transfer instructions", optional: true }, active] },
  { key: "shipping-zones", label: "Shipping zones", model: "shipping.shippingzone", fields: [{ key: "name", label: "Name" }, active] },
  { key: "cities", label: "Cities", model: "shipping.city", fields: [{ key: "name", label: "Name" }, { key: "zone", label: "Shipping zone", source: "shipping-zones" }, active] },
  { key: "shipping-methods", label: "Shipping methods", model: "shipping.shippingmethod", fields: [{ key: "name", label: "Name" }, active] },
  { key: "shipping-rates", label: "Shipping rates", model: "shipping.shippingrate", fields: [{ key: "zone", label: "Shipping zone", source: "shipping-zones" }, { key: "method", label: "Shipping method", source: "shipping-methods" }, { key: "fee", label: "Delivery fee (PKR)", type: "money" }, active] },
  { key: "checkout-policies", label: "Checkout policy", model: "shipping.checkoutpolicy", fields: [{ key: "name", label: "Name" }, { key: "tax_percent", label: "Tax on merchandise (%; enter 0 explicitly if applicable)", type: "decimal", optional: true }, { key: "reservation_minutes", label: "Reservation duration (5–1440 minutes)", type: "number" }, { key: "cod_enabled", label: "Enable Cash on Delivery", type: "checkbox" }, { key: "bank_transfer_enabled", label: "Enable Direct Bank Transfer", type: "checkbox" }] },
  { key: "products", label: "Products", model: "catalog.product", fields: [
    { key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, { key: "sku", label: "SKU" },
    { key: "category", label: "Category", source: "categories" }, { key: "brand", label: "Brand", source: "brands", optional: true },
    { key: "base_price", label: "Base price (PKR)", type: "money" }, { key: "description", label: "Description", type: "textarea", optional: true },
    { key: "image_url", label: "Direct product image link", type: "url", optional: true }, active,
  ] },
  { key: "categories", label: "Categories", model: "catalog.category", fields: [{ key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, { key: "parent", label: "Parent category", source: "categories", optional: true }, active] },
  { key: "brands", label: "Brands", model: "catalog.brand", fields: [{ key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, active] },
  { key: "variants", label: "Variants", model: "catalog.productvariant", fields: [{ key: "product", label: "Product", source: "products" }, { key: "sku", label: "SKU" }, { key: "price", label: "Price (PKR)", type: "money" }, { key: "fitment_status", label: "Vehicle compatibility", choices: [{ value: "unknown", label: "Unknown — not recorded" }, { value: "specific", label: "Specific vehicles — use product fitments" }, { value: "universal", label: "Universal fit" }] }, { key: "value_ids", label: "Options (one value per attribute)", source: "attribute-values", type: "multiple", optional: true }, active] },
  { key: "attributes", label: "Attributes", model: "catalog.attribute", fields: [{ key: "name", label: "Name" }, { key: "slug", label: "URL slug" }] },
  { key: "attribute-values", label: "Attribute values", model: "catalog.attributevalue", fields: [{ key: "attribute", label: "Attribute", source: "attributes" }, { key: "value", label: "Value" }] },
  { key: "images", label: "Image gallery", model: "catalog.productimage", fields: [{ key: "product", label: "Product", source: "products" }, { key: "url", label: "Image link", type: "url" }, { key: "alt_text", label: "Image description", optional: true }, { key: "sort_order", label: "Display order", type: "number" }, { key: "is_primary", label: "Primary image", type: "checkbox" }] },
  { key: "vehicle-makes", label: "Vehicle makes", model: "catalog.vehiclemake", fields: [{ key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, active] },
  { key: "vehicle-models", label: "Vehicle models", model: "catalog.vehiclemodel", fields: [{ key: "make", label: "Vehicle make", source: "vehicle-makes", immutable: true }, { key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, active] },
  { key: "vehicle-fitments", label: "Vehicle year ranges", model: "catalog.vehiclefitment", fields: [{ key: "model", label: "Vehicle model", source: "vehicle-models", immutable: true }, { key: "year_start", label: "First year (inclusive)", type: "year" }, { key: "year_end", label: "Last year (inclusive)", type: "year" }, { key: "engine", label: "Engine / engine code", optional: true }, { key: "trim", label: "Trim", optional: true }, active] },
  { key: "product-fitments", label: "Product fitments", model: "catalog.productfitment", fields: [{ key: "variant", label: "Product variant", source: "variants", immutable: true }, { key: "fitment", label: "Compatible vehicle", source: "vehicle-fitments" }, active] },
  { key: "inventory", label: "Inventory", model: "inventory.inventoryitem", fields: [], readonly: true },
  { key: "staff", label: "Staff roles", model: "accounts.user", fields: [], readonly: true },
  { key: "audit", label: "Audit history", model: "audit.auditevent", fields: [], readonly: true },
];
export function permission(user: User, model: string, action: string) {
  const [app, name] = model.split(".");
  return user.is_superuser || user.permissions.includes(`${app}.${action}_${name}`);
}
export function label(row: Row): string {
  if (row.vehicle) return `${row.sku} → ${label(row.vehicle as Row)}`;
  if (row.model_name) return `${row.make_name} ${row.model_name} · ${row.year_start}–${row.year_end} · ${row.engine || "Engine unspecified"} · ${row.trim || "Trim unspecified"}`;
  if (row.make_name && row.name) return `${row.make_name} ${row.name}`;
  if (row.attribute_name) return `${row.attribute_name}: ${row.value}`;
  return String(row.name || row.product_name || row.sku || row.email || row.url || row.action || row.id);
}
