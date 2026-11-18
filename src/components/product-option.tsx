"use client";
import { useState } from "react";
import { priceLabel, type Variant } from "@/lib/catalog-types";
import { apiRequest, friendlyError } from "@/lib/api";
import { cartChanged, type Cart } from "@/features/cart/types";
import Link from "next/link";

export function ProductOption({ variants }: { variants: Variant[] }) {
  const [selected, setSelected] = useState(variants[0]?.id);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const variant = variants.find(value => value.id === selected);
  async function add() {
    if (!variant || busy) return;
    setBusy(true); setNotice(""); setError("");
    try {
      const cart = await apiRequest<Cart>("/api/cart");
      const quantity = (cart.items.find(item => item.variant === variant.id)?.quantity ?? 0) + 1;
      await apiRequest("/api/cart", "PUT", { variant: variant.id, quantity });
      cartChanged(); setNotice("Added to your cart.");
    } catch (failure) { setError(friendlyError(failure)); } finally { setBusy(false); }
  }
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
    <button className="primary-button" disabled={busy || variant.quantity_available < 1} onClick={add}>{busy ? "Adding…" : "Add to cart"}</button>
    {notice && <p role="status">{notice} <Link href="/cart">View cart</Link></p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <small>Stock is reserved only when your order is placed.</small>
  </div>;
}
