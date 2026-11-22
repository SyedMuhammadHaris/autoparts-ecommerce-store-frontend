"use client";
import type { UseFormReturn } from "react-hook-form";
import type { CheckoutValues } from "@/lib/forms/schemas";
import { errorAttributes, FormErrors } from "@/lib/forms/form-errors";
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
          <label>Full name<input {...form.register("name")} autoComplete="name" {...errorAttributes(form.formState.errors, "name", "checkout")} maxLength={120} /></label>
          <label>Email<input {...form.register("email")} type="email" autoComplete="email" {...errorAttributes(form.formState.errors, "email", "checkout")} maxLength={254} /></label>
          <label>Phone<input {...form.register("phone")} type="tel" autoComplete="tel" {...errorAttributes(form.formState.errors, "phone", "checkout")} maxLength={25} /></label>
          <label>Address line 1<input {...form.register("line1")} autoComplete="address-line1" {...errorAttributes(form.formState.errors, "line1", "checkout")} maxLength={250} /></label>
          <label>Address line 2 (optional)<input {...form.register("line2")} autoComplete="address-line2" maxLength={250} /></label>
          <label>Postal code (optional)<input {...form.register("postal_code")} autoComplete="postal-code" maxLength={20} /></label>
          <label>City<select {...form.register("city", { onChange: () => form.setValue("shipping_rate", "") })} {...errorAttributes(form.formState.errors, "city", "checkout")}><option value="">Choose city</option>{options.cities.map(value => <option value={value.id} key={value.id}>{value.name}</option>)}</select></label>
          <label>Delivery method<select {...form.register("shipping_rate")} {...errorAttributes(form.formState.errors, "shipping_rate", "checkout")}><option value="">Choose delivery</option>{options.rates.filter(value => value.zone_id === zone).map(value => <option value={value.id} key={value.id}>{value.name} · {priceLabel(value.fee)}</option>)}</select></label>
          <label>Payment method<select {...form.register("payment_method")} {...errorAttributes(form.formState.errors, "payment_method", "checkout")}><option value="">Choose payment</option>{options.payment_methods.map(value => <option value={value.id} key={value.id}>{value.name}</option>)}</select></label>
          <label>Coupon code (optional)<input {...form.register("coupon_code")} maxLength={40} autoComplete="off" /></label>
          <p>One coupon per order. Eligibility and discounted totals are checked by the store before ordering.</p>
          <FormErrors errors={form.formState.errors} idPrefix="checkout" /><button className="secondary-button" disabled={busy}>Review final total</button>
        </fieldset>
      </form>
  );
}
