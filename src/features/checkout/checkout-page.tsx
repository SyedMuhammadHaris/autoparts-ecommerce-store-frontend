"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiAction, clientFetch, ApiError, friendlyError } from "@/lib/api";
import { useApiQuery } from "@/lib/query/hooks";
import { checkoutSchema, type CheckoutValues } from "@/lib/forms/schemas";
import { FormErrors } from "@/lib/forms/form-errors";
import { priceLabel } from "@/lib/catalog-types";
import type { Cart } from "@/features/cart/types";
import { Totals } from "./totals";
import type { CheckoutBody, Order, Quote, ShippingOptions } from "./types";

const attemptStorage = "autoparts-checkout-attempt";
type Review = { quote: Quote; body: Omit<CheckoutBody, "idempotency_key"> };
function savedAttempt() {
  if (typeof window === "undefined") return "";
  try { return sessionStorage.getItem(attemptStorage) ?? ""; } catch { return ""; }
}
export function CheckoutPage() {
  const router = useRouter();
  const client = useQueryClient();
  const [recoveryKey] = useState(savedAttempt);
  const [pending, setPending] = useState<CheckoutBody | null>(null);
  const recovery = useQuery({ queryKey: ["checkout-attempt", recoveryKey], enabled: !!recoveryKey, retry: false,
    queryFn: async ({ signal }) => {
      try { return await clientFetch<Order>({ path: "/api/checkout/attempt/{key}", pathParams: { key: recoveryKey }, signal }); }
      catch (failure) { if (failure instanceof ApiError && failure.status === 404) return null; throw failure; }
    },
  });
  useEffect(() => {
    if (recovery.data) { sessionStorage.removeItem(attemptStorage); router.replace(`/orders/${recovery.data.reference}`); }
    else if (recovery.data === null) sessionStorage.removeItem(attemptStorage);
  }, [recovery.data, router]);
  const canLoad = !recoveryKey || recovery.data === null;
  const cartQuery = useApiQuery<Cart>({ path: "/api/cart" }, canLoad);
  const optionsQuery = useApiQuery<ShippingOptions>({ path: "/api/shipping" }, canLoad);
  const cart = cartQuery.data;
  const options = optionsQuery.data;
  const form = useForm<CheckoutValues>({ resolver: zodResolver(checkoutSchema), defaultValues: {
    name: "", email: "", phone: "", line1: "", line2: "", postal_code: "", city: "", shipping_rate: "", payment_method: "",
  } });
  const city = useWatch({ control: form.control, name: "city" });
  const review = useMutation<Review, Error, CheckoutValues>({ retry: false, mutationFn: async values => {
    const current = await client.fetchQuery({ queryKey: ["api", "/api/cart"], queryFn: ({ signal }) => clientFetch<Cart>({ path: "/api/cart", signal }), staleTime: 0 });
    const { city, shipping_rate, payment_method, ...address } = values;
    const selection = { city: Number(city), shipping_rate: Number(shipping_rate), cart_revision: current.revision, payment_method };
    const quote = await apiAction<Quote>({ path: "/api/checkout/quote", method: "POST", payload: selection });
    return { quote, body: { ...selection, address, quote_token: quote.quote_token } };
  } });
  const place = useMutation<Order, Error, CheckoutBody>({ retry: false, mutationFn: async body => {
    sessionStorage.setItem(attemptStorage, body.idempotency_key);
    return apiAction<Order>({ path: "/api/checkout", method: "POST", payload: body });
  }, onSuccess: order => {
    sessionStorage.removeItem(attemptStorage);
    void client.invalidateQueries({ queryKey: ["api", "/api/cart"] });
    void client.invalidateQueries({ predicate: query => String(query.queryKey[1]).startsWith("/api/orders") });
    router.push(`/orders/${order.reference}`);
  }, onError: failure => {
    // Definite 4xx rejection permits editing; ambiguous failures retain the exact request/key.
    if (failure instanceof ApiError && failure.status >= 400 && failure.status < 500) {
      sessionStorage.removeItem(attemptStorage); setPending(null); review.reset();
    }
  } });
  function submitOrder() {
    if (!review.data || place.isPending) return;
    const body = pending ?? { ...review.data.body, idempotency_key: crypto.randomUUID() };
    setPending(body); place.mutate(body);
  }
  const quote = review.data?.quote;
  const busy = review.isPending || place.isPending;
  const error = place.error ?? review.error ?? cartQuery.error ?? optionsQuery.error;
  const zone = options?.cities.find(value => value.id === Number(city))?.zone_id;
  return <main id="main-content" className="catalog-page"><p className="eyebrow">One step closer</p><h1>Checkout.</h1>
    <p>Continue as a guest or <Link href="/login">sign in</Link> to keep orders in your account. Email verification is optional.</p>
    {error && <p role="alert" className="form-error">{friendlyError(error)}</p>}
    {!canLoad ? <>{recovery.error ? <p role="alert">Unable to confirm your previous checkout. Check its status before placing another order.</p> : <p role="status">Checking previous checkout…</p>}<button className="secondary-button" disabled={recovery.isFetching} onClick={() => recovery.refetch()}>Check previous order status</button></> : !cart || !options ? <><p role="status">Loading checkout…</p>{error && <button onClick={() => { void cartQuery.refetch(); void optionsQuery.refetch(); }}>Retry loading</button>}</> : !cart.items.length ? <p>Your cart is empty. <Link href="/products">Explore parts</Link></p> : !options.configured || !options.cities.length || !options.rates.length || !options.payment_methods.length ? <p role="status">Ordering is temporarily unavailable while the store configures delivery and its tax/payment policy. Your cart is saved.</p> : <div className="checkout-layout">
      <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => review.mutate(values))} onChange={() => { if (!pending) { review.reset(); place.reset(); } }}>
        <fieldset disabled={busy || !!pending}><legend>Delivery details · Pakistan</legend>
          <label>Full name<input {...form.register("name")} autoComplete="name" aria-invalid={!!form.formState.errors.name} maxLength={120} /></label>
          <label>Email<input {...form.register("email")} type="email" autoComplete="email" aria-invalid={!!form.formState.errors.email} maxLength={254} /></label>
          <label>Phone<input {...form.register("phone")} type="tel" autoComplete="tel" aria-invalid={!!form.formState.errors.phone} maxLength={25} /></label>
          <label>Address line 1<input {...form.register("line1")} autoComplete="address-line1" aria-invalid={!!form.formState.errors.line1} maxLength={250} /></label>
          <label>Address line 2 (optional)<input {...form.register("line2")} autoComplete="address-line2" maxLength={250} /></label>
          <label>Postal code (optional)<input {...form.register("postal_code")} autoComplete="postal-code" maxLength={20} /></label>
          <label>City<select {...form.register("city", { onChange: () => form.setValue("shipping_rate", "") })} aria-invalid={!!form.formState.errors.city}><option value="">Choose city</option>{options.cities.map(value => <option value={value.id} key={value.id}>{value.name}</option>)}</select></label>
          <label>Delivery method<select {...form.register("shipping_rate")} aria-invalid={!!form.formState.errors.shipping_rate}><option value="">Choose delivery</option>{options.rates.filter(value => value.zone_id === zone).map(value => <option value={value.id} key={value.id}>{value.name} · {priceLabel(value.fee)}</option>)}</select></label>
          <label>Payment method<select {...form.register("payment_method")} aria-invalid={!!form.formState.errors.payment_method}><option value="">Choose payment</option>{options.payment_methods.map(value => <option value={value.id} key={value.id}>{value.name}</option>)}</select></label>
          <FormErrors errors={form.formState.errors} /><button className="secondary-button" disabled={busy}>Review final total</button>
        </fieldset>
      </form>
      <section className="checkout-review"><h2>Order review</h2><ul>{cart.items.map(item => <li key={item.variant}>{item.name} · {item.sku} × {item.quantity}</li>)}</ul>
        {quote ? <><Totals amounts={quote} /><p>Quote valid for 10 minutes. Stock is reserved for {quote.reservation_minutes} minutes after ordering. Pending orders expire automatically if they are not confirmed.</p><p>{review.data?.body.payment_method === "cod" ? "Payment remains pending collection. No charge is made online." : "Payment remains awaiting transfer. Bank instructions and verification are handled in Phase 4; placing an order does not mark it paid."}</p>
          <button className="primary-button" disabled={busy} onClick={submitOrder}>{busy ? "Placing order…" : pending ? "Retry the same order" : `Place order · ${priceLabel(quote.total)}`}</button>
          {pending && !busy && <p>Retry the same order after a connection failure. Reloading checks its status before allowing another checkout.</p>}
        </> : <p>Complete delivery details to review the backend-calculated total.</p>}
      </section>
    </div>}
  </main>;
}
