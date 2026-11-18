"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, friendlyError } from "@/lib/api";
import { priceLabel } from "@/lib/catalog-types";
import { cartChanged, type Cart } from "./types";

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setError("");
    try { setCart(await apiRequest<Cart>("/api/cart")); } catch (failure) { setError(friendlyError(failure)); }
  }
  useEffect(() => {
    let active = true;
    apiRequest<Cart>("/api/cart").then(value => { if (active) setCart(value); }).catch(failure => { if (active) setError(friendlyError(failure)); });
    return () => { active = false; };
  }, []);
  async function update(variant: number, quantity: number) {
    if (busy) return;
    setBusy(true); setError("");
    try { setCart(await apiRequest<Cart>("/api/cart", "PUT", { variant, quantity })); cartChanged(); }
    catch (failure) { setError(friendlyError(failure)); }
    finally { setBusy(false); }
  }
  return <main id="main-content" className="catalog-page"><p className="eyebrow">Your selection</p><h1>Your cart.</h1>
    <p>Prices and availability are checked again at checkout. Items in your cart are not reserved.</p>
    {error && <p role="alert" className="form-error">{error} <button onClick={load}>Retry</button></p>}
    {!cart && !error && <p role="status">Loading your cart…</p>}
    {cart && (cart.items.length ? <>
      <div className="cart-list">{cart.items.map(item => <section className="cart-row" key={item.variant}>
        <div><h2><Link href={`/products/${item.slug}`}>{item.name}</Link></h2><p>{item.sku}</p><p>{priceLabel(item.unit_price)} each</p>
          {!item.available && <p role="alert">This option or quantity is unavailable. Update or remove it before checkout.</p>}</div>
        <div className="panel-form"><label>Quantity for {item.sku}<select value={item.quantity} disabled={busy} onChange={event => update(item.variant, Number(event.target.value))}>
          {Array.from({ length: Math.max(item.quantity, Math.min(99, item.quantity_available)) }, (_, index) => <option key={index + 1}>{index + 1}</option>)}
        </select></label><button className="secondary-button" disabled={busy} onClick={() => update(item.variant, 0)}>Remove {item.sku}</button></div>
        <strong>{priceLabel(item.line_total)}</strong>
      </section>)}</div>
      <div className="cart-summary"><h2>Subtotal: {priceLabel(cart.subtotal)}</h2><p>Shipping and any configured tax are calculated at checkout.</p>
        {cart.items.every(item => item.available) && <Link className="primary-button" href="/checkout">Continue to checkout</Link>}</div>
    </> : <div className="empty-panel"><p>Your cart is empty.</p><Link href="/products">Explore parts</Link></div>)}
  </main>;
}
