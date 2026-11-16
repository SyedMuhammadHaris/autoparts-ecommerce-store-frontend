"use client";
import { useState } from "react";
import { priceLabel, type Variant } from "@/lib/catalog-types";

export function ProductOption({ variants }: { variants: Variant[] }) {
  const [selected, setSelected] = useState(variants[0]?.id);
  const variant = variants.find(value => value.id === selected);
  if (!variant) return <p>This product is currently unavailable.</p>;
  return <div className="panel-form">
    <label>Product option<select value={selected} onChange={event => setSelected(Number(event.target.value))}>
      {variants.map(value => <option key={value.id} value={value.id}>{value.values.length ? value.values.map(item => `${item.attribute_name}: ${item.value}`).join(" / ") : "Standard"} · {value.sku}</option>)}
    </select></label>
    <strong className="product-price">{priceLabel(variant.price)}</strong>
    <p>{variant.quantity_available > 0 ? `${variant.quantity_available} available` : "Out of stock"}</p>
    <small>Ordering will become available with checkout. Availability is confirmed when ordering.</small>
  </div>;
}
