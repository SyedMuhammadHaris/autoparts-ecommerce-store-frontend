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
    <section aria-label="Vehicle compatibility"><h2>Vehicle compatibility</h2>
      {variant.fitment_status === "universal" ? <p>Universal fit — check dimensions and installation requirements.</p> : variant.fitment_status === "specific" && variant.fitments?.length ? <>
        <ul>{variant.fitments.map(fitment => <li key={fitment.id}>{fitment.make_name} {fitment.model_name} · {fitment.year_start}–{fitment.year_end} · {fitment.engine || "Engine unspecified"} · {fitment.trim || "Trim unspecified"}</li>)}</ul>
        <p>These records apply to this option. Confirm engine, trim and part specifications; make, model and year alone may not establish a fit.</p>
      </> : <p>Compatibility not recorded. Confirm fitment before ordering.</p>}
    </section>
    <small>Ordering will become available with checkout. Availability is confirmed when ordering.</small>
  </div>;
}
