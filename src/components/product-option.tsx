"use client";
import { useState } from "react";
import { priceLabel, type Variant } from "@/lib/catalog-types";
import { apiAction, clientFetch, friendlyError } from "@/lib/api";
import { type Cart } from "@/features/cart/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

export function ProductOption({ variants }: { variants: Variant[] }) {
  const [selected, setSelected] = useState(variants[0]?.id);
  const variant = variants.find(value => value.id === selected);
  const client = useQueryClient();
  const mutation = useMutation({ retry: false, mutationFn: async () => {
      if (!variant) return;
      const cart = await client.fetchQuery({ queryKey: ["api", "/api/cart"], queryFn: ({ signal }) => clientFetch<Cart>({ path: "/api/cart", signal }), staleTime: 0 });
      const quantity = (cart.items.find(item => item.variant === variant.id)?.quantity ?? 0) + 1;
      await apiAction({ path: "/api/cart", method: "PUT", payload: { variant: variant.id, quantity } });
    }, onSuccess: () => client.invalidateQueries({ queryKey: ["api", "/api/cart"] }) });
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
    <button className="primary-button" disabled={mutation.isPending || variant.quantity_available < 1} onClick={() => mutation.mutate()}>{mutation.isPending ? "Adding…" : "Add to cart"}</button>
    {mutation.isSuccess && <p role="status">Added to your cart. <Link href="/cart">View cart</Link></p>}
    {mutation.error && <p role="alert" className="form-error">{friendlyError(mutation.error)}</p>}
    <small>Stock is reserved only when your order is placed.</small>
  </div>;
}
