"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiError, friendlyError } from "@/lib/api";
import { priceLabel } from "@/lib/catalog-types";
import { cartChanged, type Cart } from "@/features/cart/types";
import { Totals } from "./totals";
import type { Address, CheckoutBody, Order, Quote, ShippingOptions } from "./types";

const attemptStorage = "autoparts-checkout-attempt";
export function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [options, setOptions] = useState<ShippingOptions | null>(null);
  const [city, setCity] = useState("");
  const [rate, setRate] = useState("");
  const [method, setMethod] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [pending, setPending] = useState<CheckoutBody | null>(null);
  const [recovery, setRecovery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    async function initialize() {
      const key = sessionStorage.getItem(attemptStorage);
      if (key) {
        try {
          const order = await apiRequest<Order>(`/api/checkout/attempt/${key}`);
          if (active) router.replace(`/orders/${order.reference}`);
          sessionStorage.removeItem(attemptStorage); return;
        } catch (failure) {
          if (!(failure instanceof ApiError) || failure.status !== 404) {
            if (active) { setRecovery(key); setError("Unable to confirm your previous checkout. Check its status before placing another order."); }
            return;
          }
          sessionStorage.removeItem(attemptStorage);
        }
      }
      try {
        const [current, shipping] = await Promise.all([apiRequest<Cart>("/api/cart"), apiRequest<ShippingOptions>("/api/shipping")]);
        if (active) { setCart(current); setOptions(shipping); setError(""); setRecovery(""); }
      } catch (failure) { if (active) setError(friendlyError(failure)); }
    }
    void initialize();
    return () => { active = false; };
  }, [router, revision]);

  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !cart) return;
    const form = new FormData(event.currentTarget);
    const contact = Object.fromEntries(["name", "email", "phone", "line1", "line2", "postal_code"].map(key => [key, String(form.get(key) ?? "").trim()])) as Address;
    setBusy(true); setError(""); setQuote(null);
    try {
      const current = await apiRequest<Cart>("/api/cart");
      setCart(current);
      const result = await apiRequest<Quote>("/api/checkout/quote", "POST", { city: Number(city), shipping_rate: Number(rate), cart_revision: current.revision, payment_method: method });
      setAddress(contact); setQuote(result);
    } catch (failure) { setError(friendlyError(failure)); } finally { setBusy(false); }
  }
  async function place() {
    if (busy || !cart || !quote || !address) return;
    const body = pending ?? { city: Number(city), shipping_rate: Number(rate), cart_revision: cart.revision, payment_method: method, quote_token: quote.quote_token, idempotency_key: crypto.randomUUID(), address };
    setBusy(true); setError(""); setPending(body);
    try {
      sessionStorage.setItem(attemptStorage, body.idempotency_key);
      const order = await apiRequest<Order>("/api/checkout", "POST", body);
      sessionStorage.removeItem(attemptStorage); cartChanged(); router.push(`/orders/${order.reference}`);
    } catch (failure) {
      setError(friendlyError(failure));
      // Only a definite rejection allows editing; ambiguous failures keep the exact payload/key.
      if (failure instanceof ApiError && failure.status >= 400 && failure.status < 500) {
        sessionStorage.removeItem(attemptStorage); setPending(null); setQuote(null);
      }
    } finally { setBusy(false); }
  }
  const zone = options?.cities.find(value => value.id === Number(city))?.zone_id;
  return <main id="main-content" className="catalog-page"><p className="eyebrow">One step closer</p><h1>Checkout.</h1>
    <p>Continue as a guest or <Link href="/login">sign in</Link> to keep orders in your account. Email verification is optional.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
    {recovery ? <button className="secondary-button" onClick={() => setRevision(value => value + 1)}>Check previous order status</button> : !cart || !options ? <><p role="status">Loading checkout…</p>{error && <button onClick={() => setRevision(value => value + 1)}>Retry loading</button>}</> : !cart.items.length ? <p>Your cart is empty. <Link href="/products">Explore parts</Link></p> : !options.configured || !options.cities.length || !options.rates.length || !options.payment_methods.length ? <p role="status">Ordering is temporarily unavailable while the store configures delivery and its tax/payment policy. Your cart is saved.</p> : <div className="checkout-layout">
      <form className="panel-form" onSubmit={review} onChange={() => { if (!pending) setQuote(null); }}>
        <fieldset disabled={busy || !!pending}><legend>Delivery details · Pakistan</legend>
          <label>Full name<input name="name" autoComplete="name" required maxLength={120} /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <label>Phone<input name="phone" type="tel" autoComplete="tel" required maxLength={25} /></label>
          <label>Address line 1<input name="line1" autoComplete="address-line1" required maxLength={250} /></label>
          <label>Address line 2 (optional)<input name="line2" autoComplete="address-line2" maxLength={250} /></label>
          <label>Postal code (optional)<input name="postal_code" autoComplete="postal-code" maxLength={20} /></label>
          <label>City<select value={city} required onChange={event => { setCity(event.target.value); setRate(""); }}><option value="">Choose city</option>{options.cities.map(value => <option value={value.id} key={value.id}>{value.name}</option>)}</select></label>
          <label>Delivery method<select value={rate} required onChange={event => setRate(event.target.value)}><option value="">Choose delivery</option>{options.rates.filter(value => value.zone_id === zone).map(value => <option value={value.id} key={value.id}>{value.name} · {priceLabel(value.fee)}</option>)}</select></label>
          <label>Payment method<select value={method} required onChange={event => setMethod(event.target.value)}><option value="">Choose payment</option>{options.payment_methods.map(value => <option value={value.id} key={value.id}>{value.name}</option>)}</select></label>
          <button className="secondary-button" disabled={busy}>Review final total</button>
        </fieldset>
      </form>
      <section className="checkout-review"><h2>Order review</h2><ul>{cart.items.map(item => <li key={item.variant}>{item.name} · {item.sku} × {item.quantity}</li>)}</ul>
        {quote ? <><Totals amounts={quote} /><p>Quote valid for 10 minutes. Stock is reserved for {quote.reservation_minutes} minutes after ordering. Pending orders expire automatically if they are not confirmed.</p><p>{method === "cod" ? "Payment remains pending collection. No charge is made online." : "Payment remains awaiting transfer. Bank instructions and verification are handled in Phase 4; placing an order does not mark it paid."}</p>
          <button className="primary-button" disabled={busy} onClick={place}>{busy ? "Placing order…" : pending ? "Retry the same order" : `Place order · ${priceLabel(quote.total)}`}</button>
          {pending && !busy && <p>Retry the same order after a connection failure. Reloading checks its status before allowing another checkout.</p>}
        </> : <p>Complete delivery details to review the backend-calculated total.</p>}
      </section>
    </div>}
  </main>;
}
