import { checkoutSchema } from "@/lib/forms/schemas";
import { resourceSchema } from "@/features/admin/schemas";
import { resources } from "@/features/admin/resources";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { useForm } from "react-hook-form";
import type { CheckoutValues } from "@/lib/forms/schemas";
import { renderWithQuery as render } from "./helpers/render";
import { screen } from "@testing-library/react";

it("validates coupon administration without inventing dates or usage limits", () => {
  const schema = resourceSchema(resources.find(resource => resource.key === "coupons")!, false);
  const values = { name: "Test campaign", code: "TEST10", kind: "percent", value: "10.00", min_subtotal: "0.00", starts_at: "2026-11-01T00:00:00+00:00", ends_at: "2026-12-01T00:00:00+00:00", global_limit: "10", per_account_limit: "", is_active: false };
  expect(schema.parse(values).per_account_limit).toBeNull();
  expect(schema.safeParse({ ...values, value: "101.00" }).success).toBe(false);
  expect(schema.safeParse({ ...values, global_limit: "0" }).success).toBe(false);
  expect(schema.safeParse({ ...values, per_account_limit: "11" }).success).toBe(false);
  expect(schema.safeParse({ ...values, ends_at: "2026-10-01T00:00:00+00:00" }).success).toBe(false);
});
it("keeps coupon entry optional inside the existing checkout form", () => {
  function Harness() {
    const form = useForm<CheckoutValues>();
    return <CheckoutForm form={form} options={{ configured: true, cities: [], rates: [], payment_methods: [] }} zone={undefined} busy={false} locked={false} onReview={jest.fn()} onChange={jest.fn()} />;
  }
  render(<Harness />);
  expect(screen.getByLabelText("Coupon code (optional)")).toBeInTheDocument();
  expect(checkoutSchema.shape.coupon_code.safeParse(undefined).success).toBe(true);
  expect(checkoutSchema.shape.coupon_code.safeParse("INVALID,CODE").success).toBe(false);
});
