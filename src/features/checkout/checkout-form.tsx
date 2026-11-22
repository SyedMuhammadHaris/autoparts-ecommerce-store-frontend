"use client";
import type { UseFormReturn } from "react-hook-form";
import type { CheckoutValues } from "@/lib/forms/schemas";
import { FormErrors } from "@/lib/forms/form-errors";
import { priceLabel } from "@/lib/catalog-types";
import type { ShippingOptions } from "./types";

type Props = {
  form: UseFormReturn<CheckoutValues>;
  options: ShippingOptions;
  zone: number | undefined;
  busy: boolean;
  locked: boolean;
  onReview: (values: CheckoutValues) => void;
  onChange: () => void;
};

export function CheckoutForm({ form, options, zone, busy, locked, onReview, onChange }: Props) {
  return (
      <form noValidate className="panel-form" onSubmit={form.handleSubmit(onReview)} onChange={onChange}>
        <fieldset disabled={busy || locked}><legend>Delivery details · Pakistan</legend>
          <label>Full name<input {...form.register("name")} autoComplete="name" aria-invalid={!!form.formState.errors.name} maxLength={120} /></label>
          <label>Email<input {...form.register("email")} type="email" autoComplete="email" aria-invalid={!!form.formState.errors.email} maxLength={254} /></label>
          <label>Phone<input {...form.register("phone")} type="tel" autoComplete="tel" aria-invalid={!!form.formState.errors.phone} maxLength={25} /></label>
          <label>Address line 1<input {...form.register("line1")} autoComplete="address-line1" aria-invalid={!!form.formState.errors.line1} maxLength={250} /></label>
          <label>Address line 2 (optional)<input {...form.register("line2")} autoComplete="address-line2" maxLength={250} /></label>
          <label>Postal code (optional)<input {...form.register("postal_code")} autoComplete="postal-code" maxLength={20} /></label>
          <label>City<select {...form.register("city", { onChange: () => form.setValue("shipping_rate", "") })} aria-invalid={!!form.formState.errors.city}><option value="">Choose city</option>{options.cities.map(value => <option value={value.id} key={value.id}>{value.name}</option>)}</select></label>
          <label>Delivery method<select {...form.register("shipping_rate")} aria-invalid={!!form.formState.errors.shipping_rate}><option value="">Choose delivery</option>{options.rates.filter(value => value.zone_id === zone).map(value => <option value={value.id} key={value.id}>{value.name} · {priceLabel(value.fee)}</option>)}</select></label>
          <label>Payment method<select {...form.register("payment_method")} aria-invalid={!!form.formState.errors.payment_method}><option value="">Choose payment</option>{options.payment_methods.map(value => <option value={value.id} key={value.id}>{value.name}</option>)}</select></label>
          <label>Coupon code (optional)<input {...form.register("coupon_code")} maxLength={40} autoComplete="off" /></label>
          <p>One coupon per order. Eligibility and discounted totals are checked by the store before ordering.</p>
          <FormErrors errors={form.formState.errors} /><button className="secondary-button" disabled={busy}>Review final total</button>
        </fieldset>
      </form>
  );
}
